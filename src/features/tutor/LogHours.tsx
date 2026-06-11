import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { queueEmailNotification } from "../../lib/notifications";

export default function LogHours() {
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadStudents() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("requests")
        .select(`student_id, student:profiles!requests_student_id_fkey(full_name)`)
        .eq("tutor_id", session.user.id)
        .in("status", ["accepted", "scheduled", "completed"]);

      if (error) { setLoading(false); return; }

      const uniqueStudents = Array.from(
        new Map((data || []).map((item: any) => [item.student_id, item])).values()
      );
      setStudents(uniqueStudents);
      if (uniqueStudents.length > 0) setStudentId(uniqueStudents[0].student_id);
      setLoading(false);
    }
    loadStudents();
  }, []);

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !date || !hours) { toast.error("Please select a student, date, and hours."); return; }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please sign in again."); setSaving(false); return; }

    const { error } = await supabase.from("hours_logs").insert([{
      tutor_id: session.user.id,
      student_id: studentId,
      session_date: new Date(date).toISOString(),
      hours: Number(hours),
      subject: subject || "General",
      notes,
    }]);

    if (error) {
      toast.error(error.message || "Unable to log hours.");
    } else {
      toast.success("Hours logged successfully.");
      await queueEmailNotification({
        recipient_user_id: studentId,
        subject: "A tutor logged your latest session hours",
        body: `Your tutor recorded ${hours} hour(s) for ${subject || "a tutoring session"}.`,
        metadata: { event: "hours_logged", tutor_id: session.user.id, student_id: studentId },
      });
      setHours(""); setDate(""); setSubject(""); setNotes("");
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <span className="h-px w-8 bg-stone-300"></span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Tutor Tools</span>
        </div>
        <h1 className="text-4xl font-playfair">Log Tutoring Hours</h1>
        <p className="text-stone-500 mt-2">Record every session so your dashboard metrics update automatically.</p>
      </header>

      <section className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm max-w-3xl">
        <form onSubmit={handleLogHours} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-satoshi text-[10px] uppercase tracking-widest text-stone-400">Student</label>
              {loading ? (
                <div className="h-12 rounded-2xl bg-stone-100 animate-pulse" />
              ) : (
                <select value={studentId} onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-stone-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all">
                  {students.length === 0 ? (
                    <option value="">No students found</option>
                  ) : (
                    students.map((s) => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.student?.full_name || s.student_id}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="font-satoshi text-[10px] uppercase tracking-widest text-stone-400">Date</label>
              <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-stone-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="font-satoshi text-[10px] uppercase tracking-widest text-stone-400">Hours</label>
              <input type="number" min="0" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="1.5"
                className="w-full bg-stone-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>
            <div className="space-y-2">
              <label className="font-satoshi text-[10px] uppercase tracking-widest text-stone-400">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Algebra, Writing, Science"
                className="w-full bg-stone-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-satoshi text-[10px] uppercase tracking-widest text-stone-400">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
              placeholder="Add session details or student progress notes..."
              className="w-full bg-stone-100 border-none rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all resize-none" />
          </div>

          <button type="submit" disabled={saving || loading}
            className="w-full bg-black text-white rounded-2xl py-4 font-bold uppercase tracking-[0.2em] disabled:bg-stone-300">
            {saving ? "Saving..." : "Log Hours"}
          </button>
        </form>
      </section>
    </motion.div>
  );
}
