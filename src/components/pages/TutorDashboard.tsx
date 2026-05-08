import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

// Import our new sub-sections (we will create these files next)
import TutorOverview from "./sections/TutorOverview.tsx";
import UpcomingSessions from "./sections/UpcomingSessions.tsx";
import StudentRequests from "./sections/StudentRequests.tsx";
import ResourceLibrary from "./sections/ResourceLibrary.tsx";
import VolunteerSettings from "./sections/VolunteerSettings.tsx";

export default function TutorDashboard() {
  const [view, setView] = useState("overview"); // Controls which section is visible
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (!data || data.role !== "tutor") { navigate("/login"); } 
      else { setProfile(data); setLoading(false); }
    };
    checkUser();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-satoshi">Loading...</div>;

  // Logic to render the correct component
  const renderView = () => {
    switch (view) {
      case "overview": return <TutorOverview profile={profile} />;
      case "sessions": return <UpcomingSessions />;
      case "requests": return <StudentRequests />;
      case "resources": return <ResourceLibrary />;
      case "settings": return <VolunteerSettings profile={profile} setProfile={setProfile} />;
      default: return <TutorOverview profile={profile} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50 font-satoshi pt-24">
      {/* SIDEBAR */}
      <aside className="w-72 border-r border-stone-200 p-8 hidden lg:flex flex-col bg-white fixed h-full left-0 top-0 pt-32">
        <div className="mb-10 px-2">
          <h2 className="text-xl font-playfair font-bold">{profile?.full_name}</h2>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Certified Tutor</p>
        </div>
        
        <nav className="space-y-1 flex-1">
          <SidebarButton label="Overview" active={view === "overview"} onClick={() => setView("overview")} />
          <SidebarButton label="Upcoming Sessions" active={view === "sessions"} onClick={() => setView("sessions")} />
          <SidebarButton label="Student Requests" active={view === "requests"} onClick={() => setView("requests")} count={3} />
          <SidebarButton label="Resource Library" active={view === "resources"} onClick={() => setView("resources")} />
          <SidebarButton label="Volunteer Settings" active={view === "settings"} onClick={() => setView("settings")} />
        </nav>
      </aside>

      {/* DYNAMIC MAIN CONTENT */}
      <main className="flex-1 lg:ml-72 p-8 md:p-12">
        {renderView()}
      </main>
    </div>
  );
}

function SidebarButton({ label, active, onClick, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
        active ? 'bg-stone-100 text-black' : 'text-stone-400 hover:bg-stone-50'
      }`}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
      {count && <span className="bg-black text-white text-[9px] px-2 py-1 rounded-full">{count}</span>}
    </button>
  );
}