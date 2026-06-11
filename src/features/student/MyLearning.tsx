import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function MyLearning({ profile }: any) {
  const [stats, setStats] = useState({ sessionsAttended: 0, hoursLearned: 0, loading: true });

  useEffect(() => {
    async function fetchLearningStats() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStats({ sessionsAttended: 0, hoursLearned: 0, loading: false }); return; }

      const { data, error } = await supabase
        .from("hours_logs")
        .select("hours")
        .eq("student_id", session.user.id);

      if (error) { setStats({ sessionsAttended: 0, hoursLearned: 0, loading: false }); return; }

      const totalHours = (data || []).reduce((sum: number, row: any) => sum + Number(row.hours || 0), 0);
      setStats({ sessionsAttended: data?.length || 0, hoursLearned: totalHours, loading: false });
    }
    fetchLearningStats();
  }, [profile]);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-5xl font-playfair font-medium">
          Ready to study, <span className="italic">{profile?.full_name?.split(" ")[0]}?</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-stone-200">
          <p className="text-[9px] font-black uppercase text-stone-400 mb-2">Sessions Attended</p>
          <p className="text-4xl font-playfair font-bold">{stats.loading ? "..." : stats.sessionsAttended}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-stone-200">
          <p className="text-[9px] font-black uppercase text-stone-400 mb-2">Hours Learned</p>
          <p className="text-4xl font-playfair font-bold">{stats.loading ? "..." : stats.hoursLearned.toFixed(1)}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-stone-200">
          <p className="text-[9px] font-black uppercase text-stone-400 mb-2">Subject Focus</p>
          <p className="text-4xl font-playfair font-bold">{profile?.subjects?.[0] || "General"}</p>
        </div>
      </div>

      <section className="bg-white rounded-[2.5rem] p-10 border border-stone-100">
        <h3 className="text-2xl font-playfair font-bold mb-8">Current Mentors</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-6 bg-stone-50 rounded-3xl">
            <p className="font-bold">Marcus Aurelius</p>
            <p className="text-stone-400 text-sm">Philosophy • Mon 4:00 PM</p>
          </div>
        </div>
      </section>
    </div>
  );
}
