import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

export default function LeadershipDashboard() {
  const [view, setView] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [requestSavingId, setRequestSavingId] = useState<string | null>(null);
  const [grantQuery, setGrantQuery] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [matchingProfiles, setMatchingProfiles] = useState<any[]>([]);
  // Announcement form state
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annTarget, setAnnTarget] = useState("all");
  const [annPinned, setAnnPinned] = useState(false);
  const [annSaving, setAnnSaving] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      if (!user) { navigate("/login", { replace: true }); return; }

      let { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      if (!data && !error) {
        const { data: created } = await supabase
          .from("profiles")
          .upsert({ id: user.id, email: user.email, full_name: user.email, role: "student" }, { onConflict: "id" })
          .select().maybeSingle();
        data = created;
      }

      if (!data) { toast.error("Could not load profile. Please sign out and try again."); setLoading(false); return; }

      const role = data?.role;
      const rolesArr: string[] = data?.roles ?? [];
      const allowed = role === "master" || role === "leadership"
        || rolesArr.includes("master") || rolesArr.includes("leadership");

      if (!allowed) { navigate("/studentdashboard", { replace: true }); return; }

      setProfile(data);
      await Promise.all([fetchLogs(), fetchRequests(), fetchAnnouncements()]);
      setLoading(false);

      const hoursChannel = supabase.channel("leadership-hours")
        .on("postgres_changes", { event: "*", schema: "public", table: "hours_logs" }, fetchLogs)
        .subscribe();
      const reqChannel = supabase.channel("leadership-requests")
        .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, fetchRequests)
        .subscribe();
      const annChannel = supabase.channel("leadership-announcements")
        .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, fetchAnnouncements)
        .subscribe();

      return () => {
        supabase.removeChannel(hoursChannel);
        supabase.removeChannel(reqChannel);
        supabase.removeChannel(annChannel);
      };
    }
    load();
  }, [navigate, user, authLoading]);

  const fetchLogs = async () => {
    const { data } = await supabase.from("hours_logs").select("*")
      .order("created_at", { ascending: false }).limit(50);
    setLogs(data ?? []);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("requests")
      .select(`
        id, subject, status, tutor_id, student_id, meeting_date, created_at,
        student_profile:profiles!requests_student_id_fkey(full_name),
        tutor_profile:profiles!requests_tutor_id_fkey(full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);
    setRequests(data ?? []);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select(`id, title, body, pinned, target_role, created_at, author:profiles!announcements_author_id_fkey(full_name)`)
      .order("created_at", { ascending: false })
      .limit(20);
    setAnnouncements(data ?? []);
  };

  const handleApprove = async (id: string) => {
    setSavingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please sign in again."); setSavingId(null); return; }

    const { error } = await supabase.from("hours_logs")
      .update({ approved: true, approved_by: session.user.id, approved_at: new Date().toISOString() })
      .eq("id", id);

    if (error) toast.error(error.message);
    else { toast.success("Hours approved."); setLogs((l) => l.map((x) => x.id === id ? { ...x, approved: true } : x)); }
    setSavingId(null);
  };

  const handleAcceptRequest = async (id: string) => {
    setRequestSavingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please sign in again."); setRequestSavingId(null); return; }

    const { error } = await supabase.from("requests")
      .update({ status: "accepted", accepted_by: session.user.id, accepted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) toast.error(error.message);
    else { toast.success("Request accepted."); setRequests((r) => r.filter((x) => x.id !== id)); }
    setRequestSavingId(null);
  };

  const handleGrantLeadership = async () => {
    if (!grantQuery.trim()) { toast.error("Enter a name to search."); return; }
    setGrantLoading(true);
    const { data, error } = await supabase.from("profiles")
      .select("id, role, full_name")
      .ilike("full_name", `%${grantQuery.trim()}%`)
      .limit(5);

    if (error || !data?.length) { toast.error(error?.message ?? "No user found."); setGrantLoading(false); return; }
    if (data.length > 1) { setMatchingProfiles(data); toast.success(`Found ${data.length} users. Pick one.`); setGrantLoading(false); return; }

    const target = data[0];
    if (target.role === "leadership" || target.role === "master") {
      toast.error("User already has elevated access.");
      setGrantLoading(false);
      return;
    }
    await promoteProfile(target.id, target.full_name);
  };

  const promoteProfile = async (id: string, name: string) => {
    const { error } = await supabase.from("profiles").update({ role: "leadership" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Leadership granted to ${name}.`); setGrantQuery(""); setMatchingProfiles([]); }
    setGrantLoading(false);
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) { toast.error("Title and body are required."); return; }
    setAnnSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please sign in again."); setAnnSaving(false); return; }

    const { error } = await supabase.from("announcements").insert([{
      author_id: session.user.id,
      title: annTitle.trim(),
      body: annBody.trim(),
      target_role: annTarget,
      pinned: annPinned,
    }]);

    if (error) toast.error(error.message);
    else {
      toast.success("Announcement posted!");
      setAnnTitle(""); setAnnBody(""); setAnnTarget("all"); setAnnPinned(false);
      fetchAnnouncements();
    }
    setAnnSaving(false);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Announcement deleted."); setAnnouncements((a) => a.filter((x) => x.id !== id)); }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    const { error } = await supabase.from("announcements").update({ pinned: !currentPinned }).eq("id", id);
    if (error) toast.error(error.message);
    else setAnnouncements((a) => a.map((x) => x.id === id ? { ...x, pinned: !currentPinned } : x));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  const isMaster = profile?.role === "master" || (profile?.roles ?? []).includes("master");
  const pendingLogs = logs.filter((l) => !l.approved).length;

  return (
    <div className="flex min-h-screen bg-stone-50 pt-24">
      <aside className="w-72 border-r border-stone-200 p-8 hidden lg:flex flex-col bg-white fixed h-full left-0 top-0 pt-32 shadow-sm">
        <div className="mb-10 px-2">
          <h2 className="text-xl font-playfair font-bold">{profile?.full_name}</h2>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">
            {isMaster ? "Master Admin" : "Leadership"}
          </p>
        </div>
        <nav className="space-y-1 flex-1">
          <SidebarBtn label="Overview"          active={view === "overview"}       onClick={() => setView("overview")} />
          <SidebarBtn label="Approve Hours"     active={view === "hours"}          onClick={() => setView("hours")}
            count={pendingLogs > 0 ? pendingLogs : null} />
          <SidebarBtn label="Student Requests"  active={view === "requests"}       onClick={() => setView("requests")}
            count={requests.length > 0 ? requests.length : null} />
          <SidebarBtn label="Announcements"     active={view === "announcements"}  onClick={() => setView("announcements")} />
          {isMaster && (
            <SidebarBtn label="Grant Leadership" active={view === "grant"} onClick={() => setView("grant")} />
          )}
        </nav>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
          className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-black transition-all p-4 text-left"
        >
          Sign Out
        </button>
      </aside>

      <main className="flex-1 lg:ml-72 p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          {view === "overview" && (
            <div className="space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
                <h1 className="text-4xl font-playfair font-bold">Leadership Dashboard</h1>
                <p className="text-stone-500 mt-2">Manage requests, approve logged hours, and promote team members.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <StatCard label="Your Role" value={isMaster ? "Master" : "Leadership"} />
                <StatCard label="Pending Requests" value={String(requests.length)} />
                <StatCard label="Pending Hour Logs" value={String(pendingLogs)} />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
                  <h2 className="text-2xl font-playfair font-bold mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button onClick={() => setView("requests")} className="w-full bg-black text-white px-6 py-4 rounded-2xl font-bold hover:bg-stone-900 transition-all">Review Requests</button>
                    <button onClick={() => setView("hours")} className="w-full bg-stone-100 text-stone-900 px-6 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">Approve Hours</button>
                    <button onClick={() => setView("announcements")} className="w-full bg-stone-100 text-stone-900 px-6 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">Post Announcement</button>
                    {isMaster && <button onClick={() => setView("grant")} className="w-full bg-stone-100 text-stone-900 px-6 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">Grant Leadership</button>}
                  </div>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
                  <h2 className="text-2xl font-playfair font-bold mb-4">Pending Requests</h2>
                  <div className="space-y-3">
                    {requests.slice(0, 3).map((r) => (
                      <div key={r.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                        <p className="font-bold">{r.student_profile?.full_name ?? "Unknown Student"}</p>
                        <p className="text-sm text-stone-500">Tutor: {r.tutor_profile?.full_name ?? r.tutor_id}</p>
                        <p className="text-sm text-stone-500">Subject: {r.subject || "General"}</p>
                      </div>
                    ))}
                    {requests.length === 0 && <p className="text-sm text-stone-400">No pending requests.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "hours" && (
            <div className="space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
                <h1 className="text-4xl font-playfair font-bold">Approve Tutor Hours</h1>
                <p className="text-stone-500 mt-2">Review and approve logged hours before they are finalized.</p>
              </div>
              {logs.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
                  <p className="text-stone-500">No logged hours yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {logs.map((log) => (
                    <div key={log.id} className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="text-sm text-stone-400 uppercase tracking-[0.3em] mb-2">{log.subject || "General"}</p>
                          <h2 className="text-2xl font-playfair font-bold">{log.hours} hrs logged</h2>
                          <p className="text-sm text-stone-500 mt-1">Session on {new Date(log.session_date).toLocaleDateString()}</p>
                        </div>
                        <p className={`text-[11px] font-bold uppercase ${log.approved ? "text-emerald-600" : "text-amber-600"}`}>
                          {log.approved ? "Approved" : "Pending"}
                        </p>
                      </div>
                      {!log.approved && (
                        <button onClick={() => handleApprove(log.id)} disabled={savingId === log.id}
                          className="mt-6 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-stone-900 transition-all disabled:opacity-50">
                          {savingId === log.id ? "Approving..." : "Approve Hours"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "requests" && (
            <div className="space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
                <h1 className="text-4xl font-playfair font-bold">Student Requests</h1>
                <p className="text-stone-500 mt-2">Accept requests so tutors can start sessions.</p>
              </div>
              {requests.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
                  <p className="text-stone-500">No pending requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((r) => (
                    <div key={r.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-stone-50 p-6 rounded-3xl border border-stone-200">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-2">{r.subject || "Tutoring Request"}</p>
                        <p className="font-bold text-lg">{r.student_profile?.full_name ?? "Unknown Student"}</p>
                        <p className="text-sm text-stone-500">Tutor: {r.tutor_profile?.full_name ?? r.tutor_id}</p>
                        <p className="text-sm text-stone-500">Requested {new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => handleAcceptRequest(r.id)} disabled={requestSavingId === r.id}
                        className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-stone-900 transition-all disabled:opacity-50">
                        {requestSavingId === r.id ? "Accepting..." : "Accept Request"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "announcements" && (
            <div className="space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
                <h1 className="text-4xl font-playfair font-bold">Announcements</h1>
                <p className="text-stone-500 mt-2">Post updates visible to all students and tutors.</p>
              </div>

              {/* Post form */}
              <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
                <h2 className="text-2xl font-playfair font-bold mb-6">Post New Announcement</h2>
                <form onSubmit={handlePostAnnouncement} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Title</label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="Announcement title..."
                      className="w-full bg-stone-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Body</label>
                    <textarea
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      rows={4}
                      placeholder="Write your announcement here..."
                      className="w-full bg-stone-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Audience</label>
                      <select
                        value={annTarget}
                        onChange={(e) => setAnnTarget(e.target.value)}
                        className="w-full bg-stone-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all"
                      >
                        <option value="all">Everyone</option>
                        <option value="student">Students Only</option>
                        <option value="tutor">Tutors Only</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="pinned"
                        checked={annPinned}
                        onChange={(e) => setAnnPinned(e.target.checked)}
                        className="w-5 h-5 rounded accent-black cursor-pointer"
                      />
                      <label htmlFor="pinned" className="text-sm font-bold cursor-pointer">Pin this announcement</label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={annSaving}
                    className="bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-stone-900 transition-all disabled:opacity-50"
                  >
                    {annSaving ? "Posting..." : "Post Announcement"}
                  </button>
                </form>
              </div>

              {/* Existing announcements */}
              {announcements.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-stone-700">Published Announcements</h2>
                  {announcements.map((ann) => (
                    <div key={ann.id} className={`bg-white rounded-3xl border p-6 shadow-sm ${ann.pinned ? "border-black" : "border-stone-200"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {ann.pinned && (
                              <span className="text-[9px] font-black uppercase bg-black text-white px-2 py-1 rounded-full">Pinned</span>
                            )}
                            {ann.target_role !== "all" && (
                              <span className="text-[9px] font-black uppercase bg-stone-100 text-stone-600 px-2 py-1 rounded-full">{ann.target_role}s only</span>
                            )}
                          </div>
                          <h3 className="font-bold text-stone-900">{ann.title}</h3>
                          <p className="text-sm text-stone-500 mt-1">{ann.body}</p>
                          <p className="text-[10px] text-stone-400 mt-2">{new Date(ann.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleTogglePin(ann.id, ann.pinned)}
                            className="text-[10px] font-bold uppercase px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 transition"
                          >
                            {ann.pinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="text-[10px] font-bold uppercase px-3 py-2 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "grant" && isMaster && (
            <div className="space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
                <h1 className="text-4xl font-playfair font-bold">Grant Leadership Access</h1>
                <p className="text-stone-500 mt-2">Search your team and promote someone to leadership.</p>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                  <input type="text" value={grantQuery} onChange={(e) => setGrantQuery(e.target.value)}
                    placeholder="Search by full name"
                    className="w-full bg-stone-100 border border-stone-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all" />
                  <button onClick={handleGrantLeadership} disabled={grantLoading}
                    className="bg-black text-white px-6 py-4 rounded-2xl font-bold hover:bg-stone-900 transition-all disabled:opacity-50">
                    {grantLoading ? "Searching..." : "Find User"}
                  </button>
                </div>
                {matchingProfiles.length > 1 && (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm text-stone-500">Select a user to promote:</p>
                    {matchingProfiles.map((u) => (
                      <div key={u.id} className="flex items-center justify-between gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                        <p className="font-bold">{u.full_name}</p>
                        <button onClick={() => promoteProfile(u.id, u.full_name)}
                          className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-stone-900 transition-all">
                          Promote
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarBtn({ label, active, onClick, count }: any) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
        active ? "bg-stone-100 text-black" : "text-stone-400 hover:bg-stone-50"
      }`}>
      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
      {count != null && count > 0 && (
        <span className="bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{count}</span>
      )}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] font-bold text-stone-400">{label}</p>
      <p className="text-2xl font-playfair font-bold mt-4">{value}</p>
    </div>
  );
}
