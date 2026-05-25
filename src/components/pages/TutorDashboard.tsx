import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

// Sub-sections
import TutorOverview from "./sections/TutorOverview.tsx";
import UpcomingSessions from "./sections/UpcomingSessions.tsx";
import StudentRequests from "./sections/StudentRequests.tsx";
import ResourceLibrary from "./sections/ResourceLibrary.tsx";
import VolunteerSettings from "./sections/VolunteerSettings.tsx";
import LogHours from "./sections/LogHours.tsx";
import Messaging from "./sections/Messaging.tsx";
import LeadershipDashboard from "./LeadershipDashboard.tsx";

export default function TutorDashboard() {
  const [view, setView] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // 1. Local state for the badge count
  const [requestCount, setRequestCount] = useState(0); 
  
  const navigate = useNavigate();

  // 2. Function to fetch only the count of pending requests
  const fetchCount = async (userId: string) => {
    const { count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("tutor_id", userId)
      .eq("status", "pending");

    if (!error) setRequestCount(count || 0);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      // Fetch Profile
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      
      if (!data || (data.role !== "tutor" && data.role !== "master" && data.role !== "leadership")) {
        navigate("/login"); 
      } else {
        setProfile(data);
        setLoading(false);
        if (data.role !== "tutor") {
          setView("leadership");
        }

        if (data.role === "tutor") {
          // 3. Initial fetch when page loads
          fetchCount(session.user.id);

          // 4. THE REALTIME LISTENER
          // This watches the 'requests' table for any changes
          const channel = supabase
            .channel("sidebar-count-changes")
            .on(
              "postgres_changes",
              { 
                event: "*", 
                schema: "public", 
                table: "requests",
                filter: `tutor_id=eq.${session.user.id}` // Only listen to YOUR requests
              },
              () => {
                console.log("Change detected! Updating count...");
                fetchCount(session.user.id);
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      }
    };
    checkUser();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const renderView = () => {
    switch (view) {
      case "overview": return <TutorOverview profile={profile} />;
      case "sessions": return <UpcomingSessions />;
      case "requests": return <StudentRequests />;
      case "hours": return <LogHours />;
      case "messages": return <Messaging />;
      case "leadership": return <LeadershipDashboard />;
      case "resources": return <ResourceLibrary />;
      case "settings": return <VolunteerSettings profile={profile} setProfile={setProfile} />;
      default: return <TutorOverview profile={profile} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-stone-50 pt-24">
      {/* SIDEBAR */}
      <aside className="w-72 border-r border-stone-200 p-8 hidden lg:flex flex-col bg-white fixed h-full left-0 top-0 pt-32 shadow-sm">
        <div className="mb-10 px-2">
          <h2 className="text-xl font-playfair font-bold">{profile?.full_name}</h2>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">
            {profile?.role === "master" ? "Master Admin" : profile?.role === "leadership" ? "Leadership" : "Certified Tutor"}
          </p>
        </div>
        
        <nav className="space-y-1 flex-1">
          <SidebarButton label="Overview" active={view === "overview"} onClick={() => setView("overview")} />
          {profile?.role === "tutor" && (
            <>
              <SidebarButton label="Upcoming Sessions" active={view === "sessions"} onClick={() => setView("sessions")} />
              <SidebarButton label="Log Hours" active={view === "hours"} onClick={() => setView("hours")} />
              <SidebarButton 
                label="Student Requests" 
                active={view === "requests"} 
                onClick={() => setView("requests")} 
                count={requestCount > 0 ? requestCount : null} 
              />
              <SidebarButton label="Messages" active={view === "messages"} onClick={() => setView("messages")} />
              <SidebarButton label="Resource Library" active={view === "resources"} onClick={() => setView("resources")} />
              <SidebarButton label="Volunteer Settings" active={view === "settings"} onClick={() => setView("settings")} />
            </>
          )}
          {(profile?.role === "master" || profile?.role === "leadership") && (
            <SidebarButton label="Leadership" active={view === "leadership"} onClick={() => setView("leadership")} />
          )}
        </nav>
      </aside>

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
      {/* Only render the bubble if count exists */}
      {count !== null && count > 0 && (
        <span className="bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold animate-in zoom-in">
          {count}
        </span>
      )}
    </button>
  );
}