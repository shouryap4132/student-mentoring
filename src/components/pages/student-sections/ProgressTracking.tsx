import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../../../utils/supabaseClient";

export default function ProgressTracking({ profile }: any) {
  const [progress, setProgress] = useState({ hoursLearned: 0, sessionsAttended: 0, goalHours: profile?.goal_hours || 30, loading: true });

  useEffect(() => {
    async function fetchProgress() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setProgress({ hoursLearned: 0, sessionsAttended: 0, goalHours: profile?.goal_hours || 30, loading: false });
        return;
      }

      const { data, error } = await supabase
        .from("hours_logs")
        .select("hours")
        .eq("student_id", session.user.id)
        .eq("approved", true);

      if (error) {
        console.error("Failed to fetch progress:", error);
        setProgress({ hoursLearned: 0, sessionsAttended: 0, goalHours: profile?.goal_hours || 30, loading: false });
        return;
      }

      const totalHours = (data || []).reduce((sum: number, row: any) => sum + Number(row.hours || 0), 0);
      setProgress({
        hoursLearned: totalHours,
        sessionsAttended: data?.length || 0,
        goalHours: profile?.goal_hours || 30,
        loading: false,
      });
    }

    fetchProgress();

    // REALTIME LISTENER - Watch for approved hours changes
    let channel: any = null;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;

      channel = supabase
        .channel(`progress-${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "hours_logs",
            filter: `student_id=eq.${session.user.id}`,
          },
          () => {
            console.log("Progress update detected! Refreshing...");
            fetchProgress();
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [profile]);

  const percentage = progress.goalHours ? Math.min(100, (progress.hoursLearned / progress.goalHours) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-playfair font-bold">Learning Progress</h2>
          <p className="text-stone-500 mt-2">Real-time progress synced with approved tutor sessions.</p>
        </div>
        <div className="bg-stone-900 text-white px-6 py-4 rounded-3xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400">Goal</p>
          <p className="text-2xl font-playfair font-bold">{progress.goalHours} hrs</p>
        </div>
      </div>

      <div className="bg-black text-white p-10 rounded-[3rem]">
        <p className="text-sm text-stone-400 mb-2 uppercase tracking-widest font-bold">Monthly Goal</p>
        <h4 className="text-2xl font-playfair mb-8">{progress.loading ? "Loading progress..." : `${percentage.toFixed(0)}% completed`}</h4>
        <div className="w-full bg-stone-800 h-4 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="bg-white h-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-stone-200">
          <p className="text-stone-400 text-[10px] font-bold uppercase mb-2">Hours Learned</p>
          <p className="text-xl font-bold">{progress.loading ? "..." : progress.hoursLearned.toFixed(1)}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-200">
          <p className="text-stone-400 text-[10px] font-bold uppercase mb-2">Sessions Completed</p>
          <p className="text-xl font-bold">{progress.loading ? "..." : progress.sessionsAttended}</p>
        </div>
      </div>
    </div>
  );
}
