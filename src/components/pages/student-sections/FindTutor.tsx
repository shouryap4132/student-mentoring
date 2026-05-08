import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";

export default function FindTutor() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requestingId, setRequestingId] = useState<string | null>(null);
  
  // Now storing objects to track the specific status of each request
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setLoading(false);

    const [tutorsRes, requestsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "tutor"),
      supabase.from("requests").select("tutor_id, status").eq("student_id", session.user.id)
    ]);

    if (requestsRes.data) {
      const statusMap: Record<string, string> = {};
      requestsRes.data.forEach(r => {
        statusMap[String(r.tutor_id).toLowerCase()] = r.status;
      });
      setRequestStatuses(statusMap);
    }

    if (tutorsRes.data) setTutors(tutorsRes.data);
    setLoading(false);
  };

  const handleRequest = async (tutorId: string, subject: string) => {
    setRequestingId(tutorId);
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from("requests").insert({
      student_id: session?.user.id,
      tutor_id: tutorId,
      subject: subject || "General Inquiry",
      status: "pending"
    });

    if (!error) {
      setRequestStatuses(prev => ({ ...prev, [tutorId.toLowerCase()]: "pending" }));
    }
    setRequestingId(null);
  };

  const handleSchedule = async (tutorId: string) => {
    const date = selectedDates[tutorId];
    if (!date) return alert("Please select a date first");

    const { error } = await supabase
      .from("requests")
      .update({ meeting_date: date, status: "scheduled" })
      .eq("tutor_id", tutorId)
      .eq("status", "accepted");

    if (!error) {
      alert("Meeting scheduled!");
      setRequestStatuses(prev => ({ ...prev, [tutorId.toLowerCase()]: "scheduled" }));
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-playfair font-bold">Find a Mentor</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutors.map((tutor) => {
          const tid = String(tutor.id).toLowerCase();
          const status = requestStatuses[tid];

          return (
            <div key={tutor.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex justify-between mb-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center font-bold">
                    {tutor.full_name?.[0]}
                  </div>
                  {status && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      status === 'accepted' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-stone-50 text-stone-400 border-stone-100'
                    }`}>
                      {status}
                    </span>
                  )}
                </div>
                <h4 className="text-xl font-bold">{tutor.full_name}</h4>
                <p className="text-sm text-stone-500 mt-2 mb-6">{tutor.bio}</p>
              </div>

              {/* DYNAMIC BUTTON LOGIC */}
              <div className="space-y-3">
                {status === "accepted" ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase text-green-600">Mentor accepted! Pick a date:</p>
                    <input 
                      type="datetime-local" 
                      onChange={(e) => setSelectedDates(prev => ({ ...prev, [tutor.id]: e.target.value }))}
                      className="w-full p-3 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black"
                    />
                    <button 
                      onClick={() => handleSchedule(tutor.id)}
                      className="w-full py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                    >
                      Confirm Meeting
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={!!status || requestingId === tutor.id}
                    onClick={() => handleRequest(tutor.id, tutor.subjects?.[0])}
                    className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                      status 
                        ? "bg-stone-100 text-stone-300 border border-stone-200 cursor-not-allowed" 
                        : "bg-black text-white hover:bg-stone-800"
                    }`}
                  >
                    {status === "pending" ? "Request Sent" : status === "scheduled" ? "Scheduled" : "Request Mentorship"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}