import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

// Section Imports
import MyLearning from "./student-sections/MyLearning.tsx";
import FindTutor from "./student-sections/FindTutor.tsx";
import StudyMaterials from "./student-sections/StudyMaterials.tsx";
import ProgressTracking from "./student-sections/ProgressTracking.tsx";
import StudentSettings from "./student-sections/StudentSettings.tsx";

export default function StudentDashboard() {
  const [view, setView] = useState("learning");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error || !data || data.role !== "student") {
        navigate("/login");
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    getProfile();
  }, [navigate]);

  const renderView = () => {
    switch (view) {
      case "learning": return <MyLearning profile={profile} />;
      case "tutors": return <FindTutor />;
      case "materials": return <StudyMaterials />;
      case "progress": return <ProgressTracking profile={profile} />;
      case "settings": return <StudentSettings profile={profile} setProfile={setProfile} />;
      default: return <MyLearning profile={profile} />;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-stone-50 font-satoshi pt-24">
      {/* SIDEBAR */}
      <aside className="w-72 border-r border-stone-200 p-8 hidden lg:flex flex-col bg-white fixed h-full left-0 top-0 pt-32">
        <div className="mb-10 px-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">Student Profile</p>
          <h2 className="text-xl font-playfair font-bold text-stone-800">{profile?.full_name}</h2>
          <p className="text-xs text-stone-500 font-medium mt-1">{profile?.grade_level || "Grade Not Set"}</p>
        </div>
        
        <nav className="space-y-1 flex-1">
          <SidebarButton label="My Learning" active={view === "learning"} onClick={() => setView("learning")} />
          <SidebarButton label="Find a Tutor" active={view === "tutors"} onClick={() => setView("tutors")} />
          <SidebarButton label="Study Materials" active={view === "materials"} onClick={() => setView("materials")} />
          <SidebarButton label="Progress Tracking" active={view === "progress"} onClick={() => setView("progress")} />
          <SidebarButton label="Account Settings" active={view === "settings"} onClick={() => setView("settings")} />
        </nav>

        <button 
          onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}
          className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-black transition-all p-4 text-left"
        >
          Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-72 p-8 md:p-12">
        {renderView()}
      </main>
    </div>
  );
}

function SidebarButton({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all ${
        active ? 'bg-stone-100 text-black shadow-sm' : 'text-stone-400 hover:bg-stone-50'
      }`}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}