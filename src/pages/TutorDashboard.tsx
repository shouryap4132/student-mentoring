import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import TutorOverview from "../features/tutor/TutorOverview";
import UpcomingSessions from "../features/tutor/UpcomingSessions";
import StudentRequests from "../features/tutor/StudentRequests";
import ResourceLibrary from "../features/tutor/ResourceLibrary";
import VolunteerSettings from "../features/tutor/VolunteerSettings";
import LogHours from "../features/tutor/LogHours";
import AnnouncementsView from "../features/shared/AnnouncementsView";
import Messaging from "../components/Messaging";

export default function TutorDashboard() {
  const [view, setView] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const fetchCount = async (userId: string) => {
    const { count } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", userId)
      .eq("status", "pending");
    setRequestCount(count ?? 0);
  };

  const fetchUnreadCount = async (uid: string) => {
    const { data: convos } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant1_id.eq.${uid},participant2_id.eq.${uid}`);

    if (!convos?.length) { setUnreadMsgCount(0); return; }

    const convoIds = convos.map((c: any) => c.id);
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convoIds)
      .neq("sender_id", uid)
      .eq("read", false);

    setUnreadMsgCount(count ?? 0);
  };

  useEffect(() => {
    if (authLoading) return;

    async function load() {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!data && !error) {
        const { data: created } = await supabase
          .from("profiles")
          .upsert({ id: user.id, email: user.email, full_name: user.email, role: "tutor" }, { onConflict: "id" })
          .select()
          .maybeSingle();
        data = created;
      }

      if (!data) {
        toast.error("Could not load your profile. Please sign out and try again.");
        setLoading(false);
        return;
      }

      const role = data.role;
      const rolesArr: string[] = data.roles ?? [];
      const isTutor      = role === "tutor"      || rolesArr.includes("tutor");
      const isMaster     = role === "master"     || rolesArr.includes("master");
      const isLeadership = role === "leadership" || rolesArr.includes("leadership");
      const isAllowed    = isTutor || isMaster || isLeadership;

      if (!isAllowed) {
        navigate("/studentdashboard", { replace: true });
        return;
      }

      setProfile(data);
      setLoading(false);

      fetchUnreadCount(user.id);

      const msgChannel = supabase
        .channel("tutor-msgs-unread")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
          fetchUnreadCount(user.id);
        })
        .subscribe();

      if (isTutor || isMaster) {
        fetchCount(user.id);
        const requestsChannel = supabase
          .channel("tutor-requests-count")
          .on("postgres_changes",
            { event: "*", schema: "public", table: "requests", filter: `tutor_id=eq.${user.id}` },
            () => fetchCount(user.id))
          .subscribe();

        return () => {
          supabase.removeChannel(msgChannel);
          supabase.removeChannel(requestsChannel);
        };
      }

      return () => { supabase.removeChannel(msgChannel); };
    }

    load();
  }, [navigate, user, authLoading]);

  // Clear unread badge when switching to messages view
  useEffect(() => {
    if (view === "messages") setUnreadMsgCount(0);
  }, [view]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  const role = profile?.role;
  const rolesArr: string[] = profile?.roles ?? [];
  const isTutor      = role === "tutor"      || rolesArr.includes("tutor");
  const isMaster     = role === "master"     || rolesArr.includes("master");
  const isLeadership = role === "leadership" || rolesArr.includes("leadership");
  const roleLabel    = isMaster ? "Master Admin" : isLeadership ? "Leadership" : "Certified Tutor";

  const renderView = () => {
    switch (view) {
      case "overview":      return <TutorOverview profile={profile} />;
      case "sessions":      return <UpcomingSessions />;
      case "requests":      return <StudentRequests />;
      case "hours":         return <LogHours />;
      case "messages":      return <Messaging />;
      case "resources":     return <ResourceLibrary />;
      case "notices":       return <AnnouncementsView />;
      case "settings":      return <VolunteerSettings profile={profile} setProfile={setProfile} />;
      default:              return <TutorOverview profile={profile} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50 pt-24">
      <aside className="w-72 border-r border-stone-200 p-8 hidden lg:flex flex-col bg-white fixed h-full left-0 top-0 pt-32 shadow-sm">
        <div className="mb-10 px-2">
          <h2 className="text-xl font-playfair font-bold">{profile?.full_name}</h2>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{roleLabel}</p>
        </div>

        <nav className="space-y-1 flex-1">
          <SidebarBtn label="Overview" active={view === "overview"} onClick={() => setView("overview")} />

          {(isTutor || isMaster) && (
            <>
              <SidebarBtn label="Upcoming Sessions"  active={view === "sessions"} onClick={() => setView("sessions")} />
              <SidebarBtn label="Log Hours"           active={view === "hours"}    onClick={() => setView("hours")} />
              <SidebarBtn
                label="Student Requests"
                active={view === "requests"}
                onClick={() => setView("requests")}
                count={requestCount > 0 ? requestCount : null}
              />
              <SidebarBtn
                label="Messages"
                active={view === "messages"}
                onClick={() => setView("messages")}
                count={unreadMsgCount > 0 ? unreadMsgCount : null}
              />
              <SidebarBtn label="Resource Library"   active={view === "resources"} onClick={() => setView("resources")} />
              <SidebarBtn label="Notices"             active={view === "notices"}   onClick={() => setView("notices")} />
              <SidebarBtn label="Volunteer Settings"  active={view === "settings"}  onClick={() => setView("settings")} />
            </>
          )}

          {(isMaster || isLeadership) && (
            <SidebarBtn label="Leadership Dashboard" active={false} onClick={() => navigate("/leadership")} />
          )}
          {isMaster && (
            <SidebarBtn label="Master Dashboard" active={false} onClick={() => navigate("/masterdashboard")} />
          )}
        </nav>

        <button
          onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
          className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-black transition-all p-4 text-left"
        >
          Sign Out
        </button>
      </aside>

      <main className="flex-1 lg:ml-72 p-8 md:p-12">{renderView()}</main>
    </div>
  );
}

function SidebarBtn({ label, active, onClick, count }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
        active ? "bg-stone-100 text-black" : "text-stone-400 hover:bg-stone-50"
      }`}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
      {count != null && count > 0 && (
        <span className="bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
