import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

export default function UpcomingSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("requests")
      .select(`id, subject, meeting_date, status, student:profiles!requests_student_id_fkey(full_name)`)
      .eq("tutor_id", session.user.id)
      .eq("status", "scheduled")
      .order("meeting_date", { ascending: true });

    if (!error) setSessions(data || []);
    setLoading(false);
  };

  const handleReschedule = async (sessionId: string) => {
    const { error } = await supabase
      .from("requests")
      .update({ status: "accepted", meeting_date: null })
      .eq("id", sessionId);
    if (error) toast.error("Update failed");
    else { toast.success("Sent back to student to pick a new time."); setSessions((prev) => prev.filter((s) => s.id !== sessionId)); }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const isToday = new Date().toDateString() === date.toDateString();
    return {
      date: isToday ? "Today" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      isToday,
    };
  };

  if (loading) return <div className="p-10 text-stone-400 animate-pulse">Loading Schedule...</div>;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-playfair font-bold">Session Schedule</h2>
          <p className="text-sm text-stone-400 mt-1">Manage your upcoming tutoring appointments.</p>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-100">
              {["Student", "Subject", "Date/Time", "Action"].map((h) => (
                <th key={h} className={`p-6 text-[10px] font-black uppercase tracking-widest text-stone-400 ${h === "Action" ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-stone-400 italic">No scheduled sessions.</td></tr>
            ) : (
              sessions.map((session) => {
                const dt = formatDateTime(session.meeting_date);
                return (
                  <tr key={session.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors group">
                    <td className="p-6"><p className="font-bold text-stone-800">{session.student?.full_name || "Unknown"}</p></td>
                    <td className="p-6 text-sm text-stone-500 font-medium">{session.subject}</td>
                    <td className="p-6 text-sm">
                      <span className="font-bold text-stone-800">{dt.date}</span>
                      <span className="text-stone-400 ml-2">@ {dt.time}</span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleReschedule(session.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-black">
                          Reschedule
                        </button>
                        {dt.isToday ? (
                          <button className="bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all">Join Room</button>
                        ) : (
                          <button className="bg-stone-100 text-stone-400 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed border border-stone-200">Locked</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
