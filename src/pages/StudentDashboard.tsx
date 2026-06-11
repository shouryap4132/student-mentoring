import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";
import MyLearning from "../features/student/MyLearning";
import FindTutor from "../features/student/FindTutor";
import StudyMaterials from "../features/student/StudyMaterials";
import ProgressTracking from "../features/student/ProgressTracking";
import SessionHistory from "../features/student/SessionHistory";
import StudentSettings from "../features/student/StudentSettings";
import AnnouncementsView from "../features/shared/AnnouncementsView";
import Messaging from "../components/Messaging";

export default function StudentDashboard() {
  const location = useLocation();
  const [view, setView] = useState("learning");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

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
          .upsert({ id: user.id, email: user.email, full_name: user.email, role: "student" }, { onConflict: "id" })
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
      const isStudent = role === "student" || rolesArr.includes("student");

      if (!isStudent) {
        if (role === "master" || rolesArr.includes("master")) {
          navigate("/masterdashboard", { replace: true });
        } else if (role === "leadership" || rolesArr.includes("leadership")) {
          navigate("/leadership", { replace: true });
        } else {
          navigate("/tutordashboard", { replace: true });
        }
        return;
      }

      setProfile(data);
      const v = new URLSearchParams(location.search).get("view");
      if (v) setView(v);
      setLoading(false);

      fetchUnreadCount(user.id);

      const msgChannel = supabase
        .channel("student-msgs-unread")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
          fetchUnreadCount(user.id);
        })
        .subscribe();

      return () => { supabase.removeChannel(msgChannel); };
    }

    load();
  }, [navigate, user, authLoading]);

  // Clear unread badge when switching to messages view
  useEffect(() => {
    if (view === "messages") setUnreadMsgCount(0);
  }, [view]);

  const renderView = () => {
    switch (view) {
      case "learning":    return <MyLearning profile={profile} />;
      case "tutors":      return <FindTutor />;
      case "materials":   return <StudyMaterials />;
      case "progress":    return <ProgressTracking profile={profile} />;
      case "history":     return <SessionHistory />;
      case "messages":    return <Messaging />;
      case "notices":     return <AnnouncementsView />;
      case "settings":    return <StudentSettings profile={profile} setProfile={setProfile} />;
      default:            return <MyLearning profile={profile} />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-stone-50 font-satoshi pt-24">
      <aside className="w-72 border-r border-stone-200 p-8 hidden lg:flex flex-col bg-white fixed h-full left-0 top-0 pt-32">
        <div className="mb-10 px-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">Student Profile</p>
          <h2 className="text-xl font-playfair font-bold text-stone-800">{profile?.full_name}</h2>
          <p className="text-xs text-stone-500 font-medium mt-1">{profile?.grade_level || "Grade Not Set"}</p>
        </div>

        <nav className="space-y-1 flex-1">
          <SidebarBtn label="My Learning"       active={view === "learning"}  onClick={() => setView("learning")} />
          <SidebarBtn label="Find a Tutor"      active={view === "tutors"}    onClick={() => setView("tutors")} />
          <SidebarBtn label="Messages"          active={view === "messages"}  onClick={() => setView("messages")}
            count={unreadMsgCount > 0 ? unreadMsgCount : null} />
          <SidebarBtn label="Session History"   active={view === "history"}   onClick={() => setView("history")} />
          <SidebarBtn label="Study Materials"   active={view === "materials"} onClick={() => setView("materials")} />
          <SidebarBtn label="Progress Tracking" active={view === "progress"}  onClick={() => setView("progress")} />
          <SidebarBtn label="Notices"           active={view === "notices"}   onClick={() => setView("notices")} />
          <SidebarBtn label="Account Settings"  active={view === "settings"}  onClick={() => setView("settings")} />
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
        active ? "bg-stone-100 text-black shadow-sm" : "text-stone-400 hover:bg-stone-50"
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
