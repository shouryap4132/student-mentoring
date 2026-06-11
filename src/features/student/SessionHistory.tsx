import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SessionHistory() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data } = await supabase
        .from("hours_logs")
        .select(`
          id, session_date, hours, subject, notes, approved, created_at,
          tutor:profiles!hours_logs_tutor_id_fkey(full_name, avatar_url)
        `)
        .eq("student_id", session.user.id)
        .order("session_date", { ascending: false });

      setSessions(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-10 h-10 border-4 border-stone-100 border-t-black rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Loading sessions...</p>
    </div>
  );

  const totalHours = sessions.reduce((sum, s) => sum + Number(s.hours || 0), 0);
  const approvedHours = sessions.filter((s) => s.approved).reduce((sum, s) => sum + Number(s.hours || 0), 0);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-playfair font-bold text-stone-900">Session History</h2>
        <p className="text-stone-500 mt-2">All your past tutoring sessions, logged by your tutors.</p>
      </header>

      {sessions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-black text-white p-6 rounded-3xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2">Total Sessions</p>
            <p className="text-3xl font-playfair font-bold">{sessions.length}</p>
          </div>
          <div className="bg-white border border-stone-200 p-6 rounded-3xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2">Total Hours</p>
            <p className="text-3xl font-playfair font-bold">{totalHours.toFixed(1)}</p>
          </div>
          <div className="bg-white border border-stone-200 p-6 rounded-3xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2">Approved Hours</p>
            <p className="text-3xl font-playfair font-bold">{approvedHours.toFixed(1)}</p>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-[3rem] border-2 border-dashed border-stone-200 p-16 text-center">
          <p className="text-3xl mb-4">📚</p>
          <p className="text-stone-400 italic font-medium">No sessions recorded yet.</p>
          <p className="text-stone-400 text-sm mt-2">Sessions will appear here once your tutor logs them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
                      {s.tutor?.avatar_url ? (
                        <img src={s.tutor.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-sm font-bold text-stone-400">{s.tutor?.full_name?.[0] ?? "?"}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{s.tutor?.full_name ?? "Unknown Tutor"}</p>
                      <p className="text-xs text-stone-400">
                        {new Date(s.session_date).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="inline-block text-[10px] font-bold bg-stone-100 px-3 py-1 rounded-lg text-stone-600 uppercase tracking-wider">
                    {s.subject}
                  </span>
                  {s.notes && (
                    <p className="text-sm text-stone-500 mt-3 leading-relaxed">{s.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-playfair font-bold text-stone-900">{Number(s.hours).toFixed(1)}h</p>
                  <span className={`inline-block text-[10px] font-bold uppercase px-3 py-1 rounded-full mt-2 ${
                    s.approved
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}>
                    {s.approved ? "Approved" : "Pending Approval"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
