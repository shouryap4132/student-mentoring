import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../../../utils/supabaseClient";

export default function TutorOverview({ profile }: any) {
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNextMeeting() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("requests")
        .select(`
          meeting_date,
          profiles:student_id (
            full_name
          )
        `)
        .eq("tutor_id", session.user.id)
        .eq("status", "scheduled")
        .gte("meeting_date", new Date().toISOString()) 
        .order("meeting_date", { ascending: true })
        .limit(1)
        .single();

      if (!error && data) {
        setNextMeeting(data);
      }
      setLoading(false);
    }

    fetchNextMeeting();
  }, []);

  const formatMeetingDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <section>
        <div className="flex items-center gap-3 mb-2">
          <span className="h-px w-8 bg-stone-300"></span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Dashboard Overview</span>
        </div>
        <h1 className="text-4xl font-playfair">Impact Summary</h1>
      </section>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Total Volunteered" 
          value={`${profile?.hours_volunteered || "0"} hrs`} 
          sub="3.2 hrs this month"
        />
        <MetricCard 
          label="Student Rating" 
          value={profile?.avg_rating || "5.0"} 
          sub="Based on 12 reviews"
        />
        <MetricCard 
          label="Active Mentees" 
          value="4" 
          sub="2 new requests"
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
              <p className="text-stone-300 animate-pulse font-bold">Syncing calendar...</p>
            ) : nextMeeting ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                <p className="font-bold text-lg text-black">
                  {formatMeetingDate(nextMeeting.meeting_date)}
                </p>
                <p className="text-xs font-medium text-stone-500 capitalize">
                  with {nextMeeting.profiles?.full_name}
                </p>
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