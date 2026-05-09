import { useState, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";

export default function FindTutor() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  
  const [requestStatuses, setRequestStatuses] = useState<Record<string, string>>({});
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("find-tutor-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => {
          fetchData(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    console.log("DEBUG: Fetching tutors and requests...");

    const [tutorsRes, requestsRes] = await Promise.all([
      // Ensure avatar_url is explicitly selected here
      supabase.from("profiles")
        .select("id, full_name, bio, subjects, avatar_url")
        .eq("role", "tutor"),
      supabase.from("requests")
        .select("tutor_id, status")
        .eq("student_id", session.user.id)
    ]);

    if (tutorsRes.data) {
      console.log("DEBUG: Tutors received from Supabase:", tutorsRes.data);
      setTutors(tutorsRes.data);
    }

    if (requestsRes.data) {
      const statusMap: Record<string, string> = {};
      requestsRes.data.forEach(r => {
        statusMap[String(r.tutor_id).toLowerCase()] = r.status;
      });
      setRequestStatuses(statusMap);
    }

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

    if (error) {
      alert("Error sending request: " + error.message);
    } else {
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

    if (error) {
      alert("Error scheduling: " + error.message);
    } else {
      alert("Meeting scheduled!");
      setRequestStatuses(prev => ({ ...prev, [tutorId.toLowerCase()]: "scheduled" }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-stone-100 border-t-black rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Syncing Mentors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-4xl font-playfair font-bold text-stone-900">Find a Mentor</h2>
        <p className="text-stone-500 mt-2">Connect with experts and schedule your next session.</p>
      </header>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tutors.map((tutor) => {
          const tid = String(tutor.id).toLowerCase();
          const status = requestStatuses[tid];

          return (
            <div key={tutor.id} className="bg-white p-8 rounded-[3rem] border border-stone-200 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start mb-6">
                  {/* PROFILE PICTURE LOGIC */}
                  <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100 overflow-hidden shrink-0">
                    {tutor.avatar_url ? (
                      <img 
                        src={tutor.avatar_url} 
                        alt={tutor.full_name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`DEBUG: Image failed to load for ${tutor.full_name}. URL:`, tutor.avatar_url);
                        }}
                      />
                    ) : (
                      <span className="text-xl font-bold text-stone-400">
                        {tutor.full_name?.[0]}
                      </span>
                    )}
                  </div>
                  {status && (
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${
                      status === 'accepted' 
                        ? 'bg-green-50 text-green-600 border-green-100 animate-pulse' 
                        : 'bg-stone-50 text-stone-400 border-stone-100'
                    }`}>
                      {status}
                    </span>
                  )}
                </div>
                
                <h4 className="text-2xl font-playfair font-bold text-stone-800">{tutor.full_name}</h4>
                <p className="text-sm text-stone-500 mt-3 line-clamp-3 leading-relaxed">
                  {tutor.bio || "No bio provided."}
                </p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {tutor.subjects?.map((s: string) => (
                    <span key={s} className="text-[10px] font-bold bg-stone-100 px-2 py-1 rounded-md text-stone-600 lowercase">
                      #{s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-stone-50">
                {status === "accepted" ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-2">Request Approved</p>
                      <input 
                        type="datetime-local" 
                        onChange={(e) => setSelectedDates(prev => ({ ...prev, [tutor.id]: e.target.value }))}
                        className="w-full bg-white p-3 border border-green-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <button 
                      onClick={() => handleSchedule(tutor.id)}
                      className="w-full py-4 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                    >
                      Confirm Session
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={!!status || requestingId === tutor.id}
                    onClick={() => handleRequest(tutor.id, tutor.subjects?.[0])}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      status 
                        ? "bg-stone-100 text-stone-300 border border-stone-200 cursor-not-allowed" 
                        : "bg-black text-white hover:bg-stone-800 shadow-xl shadow-stone-200 active:scale-[0.98]"
                    }`}
                  >
                    {requestingId === tutor.id ? "Sending..." : 
                     status === "pending" ? "Waiting for Tutor" : 
                     status === "scheduled" ? "Session Booked" : 
                     "Request Mentorship"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tutors.length === 0 && (
        <div className="text-center py-20 bg-stone-50 rounded-[3rem] border-2 border-dashed border-stone-200">
          <p className="text-stone-400 font-medium italic">No mentors matching your criteria found.</p>
        </div>
      )}
    </div>
  );
}