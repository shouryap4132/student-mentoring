import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../../../utils/supabaseClient";

export default function TutorOverview({ profile }: any) {
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [metrics, setMetrics] = useState({
    volunteeredHours: 0,
    rating: 5.0,
    activeMentees: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const tutorId = session.user.id;

      // 1. Fetch Next Meeting
      const { data: meetingData } = await supabase
        .from("requests")
        .select(`meeting_date, profiles:student_id (full_name)`)
        .eq("tutor_id", tutorId)
        .eq("status", "scheduled")
        .gte("meeting_date", new Date().toISOString())
        .order("meeting_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      // 2. Fetch Active Mentees Count
      const { data: menteesData } = await supabase
        .from("requests")
        .select("student_id")
        .eq("tutor_id", tutorId)
        .in("status", ["accepted", "scheduled"]);
      const uniqueMentees = new Set(menteesData?.map((m: any) => m.student_id)).size;

      // 3. Fetch volunteer hours from logs
      const { data: logRows } = await supabase
        .from("hours_logs")
        .select("hours")
        .eq("tutor_id", tutorId);
      const volunteeredHours = (logRows || []).reduce((sum: number, row: any) => sum + Number(row.hours || 0), 0);

      setMetrics({
        volunteeredHours,
        rating: profile?.avg_rating || 5.0,
        activeMentees: uniqueMentees
      });

      if (meetingData) setNextMeeting(meetingData);
      setLoading(false);
    }

    fetchDashboardData();

    // REALTIME LISTENERS - Watch for changes to requests and hours_logs
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const requestsChannel = supabase
      .channel(`overview-requests-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `tutor_id=eq.${session.user.id}`,
        },
        () => {
          console.log("Request change detected in overview! Refreshing...");
          fetchDashboardData();
        }
      )
      .subscribe();

    const hoursChannel = supabase
      .channel(`overview-hours-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hours_logs",
          filter: `tutor_id=eq.${session.user.id}`,
        },
        () => {
          console.log("Hours log change detected in overview! Refreshing...");
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(hoursChannel);
    };
  }, [profile]);

  const formatMeetingDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      <section>
        <div className="flex items-center gap-3 mb-2">
          <span className="h-px w-8 bg-stone-300"></span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Dashboard Overview</span>
        </div>
        <h1 className="text-4xl font-playfair">Impact Summary</h1>
      </section>

      {/* METRIC CARDS - NOW REAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Total Volunteered" 
          value={`${metrics.volunteeredHours} hrs`} 
          sub="Lifetime impact"
        />
        <MetricCard 
          label="Student Rating" 
          value={metrics.rating.toFixed(1)} 
          sub="Based on student feedback"
        />
        <MetricCard 
          label="Active Mentees" 
          value={metrics.activeMentees.toString()} 
          sub="Currently mentoring"
        />
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-stone-200 shadow-sm">
        <h3 className="text-xl font-playfair font-bold mb-6">Today's Focus</h3>
        <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-stone-500 text-sm italic font-medium">"Teaching is the highest form of understanding."</p>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-300">— Aristotle</p>
          </div>
          <div className="h-12 w-px bg-stone-100 hidden md:block"></div>
          <div className="text-center md:text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Next Session</p>
            {loading ? (
              <p className="text-stone-300 animate-pulse font-bold">Syncing...</p>
            ) : nextMeeting ? (
              <div>
                <p className="font-bold text-lg text-black">{formatMeetingDate(nextMeeting.meeting_date)}</p>
                <p className="text-xs font-medium text-stone-500">with {nextMeeting.profiles?.full_name}</p>
              </div>
            ) : (
              <p className="font-bold text-lg text-stone-300 italic">No sessions booked</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, sub }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3">{label}</p>
      <p className="text-4xl font-playfair font-bold text-stone-800">{value}</p>
      <p className="text-[10px] text-stone-500 font-medium mt-2">{sub}</p>
    </div>
  );
}