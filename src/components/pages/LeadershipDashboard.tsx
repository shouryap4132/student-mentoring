import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../../utils/supabaseClient";

export default function LeadershipDashboard() {
  const [view, setView] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [requestSavingId, setRequestSavingId] = useState<string | null>(null);
  const [grantQuery, setGrantQuery] = useState("");
  const [grantLoading, setGrantLoading] = useState(false);
  const [matchingProfiles, setMatchingProfiles] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError || !profileData || (profileData.role !== "master" && profileData.role !== "leadership")) {
        navigate("/login");
        return;
      }

      setProfile(profileData);
      await Promise.all([fetchLogs(), fetchRequests()]);
      setLoading(false);
    }

    loadDashboard();
  }, [navigate]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("hours_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load hours logs:", error);
      return;
    }

    setLogs(data || []);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("requests")
      .select(`
        id,
        subject,
        status,
        tutor_id,
        student_id,
        meeting_date,
        created_at,
        profiles:student_id (full_name),
        tutor_profiles:tutor_id (full_name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load student requests:", error);
      return;
    }

    setRequests(data || []);
  };

  const handleApprove = async (id: string) => {
    setSavingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in again.");
      setSavingId(null);
      return;
    }

    const { error, data } = await supabase
      .from("hours_logs")
      .update({ approved: true, approved_by: session.user.id, approved_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Approval failed:", error);
      toast.error(error.message || "Failed to approve hours.");
    } else {
      toast.success("Hours approved.");
      const updatedRow = (data && data[0]) ? (data[0] as any) : null;
      setLogs((current) =>
        current.map((item) =>
          item.id === id ? (updatedRow ? { ...item, ...updatedRow } : item) : item
        )
      );
    }

    setSavingId(null);
  };

  const handleAcceptRequest = async (id: string) => {
    setRequestSavingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in again.");
      setRequestSavingId(null);
      return;
    }

    const { error } = await supabase
      .from("requests")
      .update({ status: "accepted", accepted_by: session.user.id, accepted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Request approval failed:", error);
      toast.error(error.message || "Failed to accept request.");
    } else {
      toast.success("Student request accepted.");
      setRequests((current) => current.filter((item) => item.id !== id));
    }

    setRequestSavingId(null);
  };

  const handleGrantLeadership = async () => {
    if (!grantQuery.trim()) {
      toast.error("Enter a full name to promote.");
      return;
    }

    setGrantLoading(true);
    const search = grantQuery.trim();
    const result = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .ilike("full_name", `%${search}%`)
      .limit(5);

    const userProfiles = result.data as any[] | null;
    const userError = result.error;

    if (userError || !userProfiles || userProfiles.length === 0) {
      toast.error(userError?.message || "No matching user found.");
      setGrantLoading(false);
      return;
    }

    if (userProfiles.length > 1) {
      setMatchingProfiles(userProfiles);
      toast.success(`Found ${userProfiles.length} users. Choose one to promote.`);
      setGrantLoading(false);
      return;
    }

    const userProfile = userProfiles[0];

    if (!userProfile) {
      toast.error("User not found in profiles.");
      setGrantLoading(false);
      return;
    }

    if (userProfile.role === "leadership" || userProfile.role === "master") {
      toast.error("This user already has leadership access.");
      setGrantLoading(false);
      return;
    }

    await promoteProfile(userProfile.id, userProfile.full_name);
  };

  const promoteProfile = async (id: string, displayName: string) => {
    const { error: grantError } = await supabase
      .from("profiles")
      .update({ role: "leadership" })
      .eq("id", id);

    if (grantError) {
      console.error("Grant leadership failed:", grantError);
      toast.error(grantError.message || "Could not grant leadership.");
    } else {
      toast.success(`Leadership access granted to ${displayName}.`);
      setGrantQuery("");
      setMatchingProfiles([]);
    }
    setGrantLoading(false);
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
        <h1 className="text-4xl font-playfair font-bold">Leadership Dashboard</h1>
        <p className="text-stone-500 mt-2">Manage requests, approve logged hours, and promote team members from one place.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-stone-400">Your role</p>
          <p className="text-2xl font-playfair font-bold mt-4">{profile?.role === "master" ? "Master" : "Leadership"}</p>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-stone-400">Pending requests</p>
          <p className="text-2xl font-playfair font-bold mt-4">{requests.length}</p>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] font-bold text-stone-400">Pending hour logs</p>
          <p className="text-2xl font-playfair font-bold mt-4">{logs.filter((item) => !item.approved).length}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
          <h2 className="text-2xl font-playfair font-bold mb-4">Quick actions</h2>
          <div className="space-y-3">
            <button onClick={() => setView("requests")} className="w-full bg-black text-white px-6 py-4 rounded-2xl font-bold hover:bg-stone-900 transition-all">Review Requests</button>
            <button onClick={() => setView("hours")} className="w-full bg-stone-100 text-stone-900 px-6 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">Approve Hours</button>
            {profile?.role === "master" && (
              <button onClick={() => setView("grant")} className="w-full bg-stone-100 text-stone-900 px-6 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all">Grant Leadership</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
          <h2 className="text-2xl font-playfair font-bold mb-4">Pending request details</h2>
          <p className="text-stone-500">Review the next few student requests waiting for approval and keep the program moving.</p>
          <div className="mt-6 grid gap-4">
            {requests.slice(0, 3).map((request) => (
              <div key={request.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                <p className="font-bold">{request.profiles?.full_name || "Unknown Student"}</p>
                <p className="text-sm text-stone-500">Tutor: {request.tutor_profiles?.full_name || request.tutor_id}</p>
                <p className="text-sm text-stone-500">Subject: {request.subject || "General"}</p>
              </div>
            ))}
            {requests.length === 0 && <p className="text-sm text-stone-400">No pending requests right now.</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHoursSection = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
        <h1 className="text-4xl font-playfair font-bold">Approve Tutor Hours</h1>
        <p className="text-stone-500 mt-2">Review and approve logged hours before they are finalized in the program.</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
          <p className="text-stone-500">No logged hours found yet.</p>
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
                <div className="text-right">
                  <p className={`text-[11px] font-bold uppercase ${log.approved ? "text-emerald-600" : "text-amber-600"}`}>
                    {log.approved ? "Approved" : "Pending Approval"}
                  </p>
                  <p className="text-stone-500 text-xs mt-1">Submitted at {new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">Tutor ID</p>
                  <p className="text-sm text-stone-700">{log.tutor_id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">Student ID</p>
                  <p className="text-sm text-stone-700">{log.student_id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">Notes</p>
                  <p className="text-sm text-stone-700">{log.notes || "No notes provided."}</p>
                </div>
              </div>

              {!log.approved && (
                <button
                  onClick={() => handleApprove(log.id)}
                  disabled={savingId === log.id}
                  className="mt-6 bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-stone-900 transition-all disabled:opacity-50"
                >
                  {savingId === log.id ? "Approving..." : "Approve Hours"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRequestsSection = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
        <h1 className="text-4xl font-playfair font-bold">Student Requests</h1>
        <p className="text-stone-500 mt-2">Accept student requests so tutors can start mentoring sessions.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
          <p className="text-stone-500">No pending student requests at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-stone-50 p-6 rounded-3xl border border-stone-200">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-2">{request.subject || "Tutoring Request"}</p>
                <p className="font-bold text-lg">{request.profiles?.full_name || "Unknown Student"}</p>
                <p className="text-sm text-stone-500">Tutor: {request.tutor_profiles?.full_name || request.tutor_id}</p>
                <p className="text-sm text-stone-500">Requested on {new Date(request.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase text-amber-600 mb-3">Pending</p>
                <button
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={requestSavingId === request.id}
                  className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-stone-900 transition-all disabled:opacity-50"
                >
                  {requestSavingId === request.id ? "Accepting..." : "Accept Request"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderGrantSection = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
        <h1 className="text-4xl font-playfair font-bold">Grant Leadership Access</h1>
        <p className="text-stone-500 mt-2">Search your team and promote someone into leadership.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
          <input
            type="text"
            value={grantQuery}
            onChange={(e) => setGrantQuery(e.target.value)}
            placeholder="Search by full name"
            className="w-full bg-stone-100 border border-stone-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all"
          />
          <button
            type="button"
            onClick={handleGrantLeadership}
            disabled={grantLoading}
            className="bg-black text-white px-6 py-4 rounded-2xl font-bold hover:bg-stone-900 transition-all disabled:opacity-50"
          >
            {grantLoading ? "Searching..." : "Find User"}
          </button>
        </div>

        {matchingProfiles.length > 0 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-stone-500">Select a user to promote:</p>
            {matchingProfiles.map((user) => (
              <div key={user.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <p className="font-bold">{user.full_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => promoteProfile(user.id, user.full_name)}
                  className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-stone-900 transition-all"
                >
                  Promote
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderView = () => {
    switch (view) {
      case "overview":
        return renderOverview();
      case "hours":
        return renderHoursSection();
      case "requests":
        return renderRequestsSection();
      case "grant":
        return profile?.role === "master" ? renderGrantSection() : renderOverview();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-50 pt-24">
      <aside className="w-72 border-r border-stone-200 p-8 hidden lg:flex flex-col bg-white fixed h-full left-0 top-0 pt-32 shadow-sm">
        <div className="mb-10 px-2">
          <h2 className="text-xl font-playfair font-bold">{profile?.full_name}</h2>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">
            {profile?.role === "master" ? "Master Admin" : "Leadership"}
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          <SidebarButton label="Overview" active={view === "overview"} onClick={() => setView("overview")} />
          <SidebarButton label="Approve Hours" active={view === "hours"} onClick={() => setView("hours")} />
          <SidebarButton label="Student Requests" active={view === "requests"} onClick={() => setView("requests")} count={requests.length > 0 ? requests.length : null} />
          {profile?.role === "master" && <SidebarButton label="Grant Leadership" active={view === "grant"} onClick={() => setView("grant")} />}
        </nav>
      </aside>

      <main className="flex-1 lg:ml-72 p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-10">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

function SidebarButton({ label, active, onClick, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
        active ? "bg-stone-100 text-black" : "text-stone-400 hover:bg-stone-50"
      }`}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
      {count !== null && count > 0 && (
        <span className="bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold animate-in zoom-in">
          {count}
        </span>
      )}
    </button>
  );
}
