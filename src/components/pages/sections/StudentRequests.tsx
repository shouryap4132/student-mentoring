import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../../utils/supabaseClient";
import { queueEmailNotification } from "../../../utils/notifications";

export default function StudentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // 1. Get Session & ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("DEBUG: Session Error:", sessionError);
        setLoading(false);
        return;
      }

      const tutorId = session?.user?.id;
      console.log("DEBUG: Logged in as Tutor ID:", tutorId);

      if (!tutorId) {
        console.warn("DEBUG: No tutor ID found in session.");
        setLoading(false);
        return;
      }

      // 2. Fetch Requests
      // We'll try the most standard join syntax first
      const { data, error } = await supabase
        .from("requests")
        .select(`
          id,
          subject,
          status,
          tutor_id,
          student_id,
          profiles:student_id (
            full_name,
            grade_level
          )
        `)
        .eq("tutor_id", tutorId)
        .eq("status", "pending");

      if (error) {
        console.group("DEBUG: Supabase Fetch Error");
        console.error("Message:", error.message);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
        console.error("Code:", error.code);
        console.groupEnd();
      } else {
        console.log("DEBUG: Successful Data Fetch:", data);
        setRequests(data || []);
      }
    } catch (err) {
      console.error("DEBUG: Unexpected JS Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId: string, studentId: string) => {
    console.log("DEBUG: Attempting to accept request:", requestId);
    const { error } = await supabase
      .from("requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    if (error) {
      console.error("DEBUG: Accept Error:", error);
      toast.error("Error accepting request: " + error.message);
    } else {
      setRequests(prev => prev.filter(r => r.id !== requestId));
      await queueEmailNotification({
        recipient_user_id: studentId,
        subject: "Your tutoring request was accepted",
        body: "Your tutor accepted your request. Check your dashboard for scheduling details.",
        metadata: { event: "request_accepted", request_id: requestId },
      });
      toast.success("Request accepted!");
    }
  };

  const handleDecline = async (requestId: string, studentId: string) => {
    console.log("DEBUG: Attempting to decline request:", requestId);
    const { error } = await supabase
      .from("requests")
      .update({ status: "declined" })
      .eq("id", requestId);

    if (error) {
      console.error("DEBUG: Decline Error:", error);
      toast.error("Error declining request: " + error.message);
    } else {
      setRequests(prev => prev.filter(r => r.id !== requestId));
      await queueEmailNotification({
        recipient_user_id: studentId,
        subject: "Your tutoring request was declined",
        body: "Your tutor declined the request. You can request another tutor or try again later.",
        metadata: { event: "request_declined", request_id: requestId },
      });
      toast.success("Request declined.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-playfair font-bold">Student Requests</h2>
      
      {requests.length === 0 ? (
        <div className="p-10 border-2 border-dashed rounded-3xl text-center text-stone-400">
          No pending requests found.
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="p-6 bg-white border rounded-3xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Incoming Request</p>
                <h4 className="text-xl font-bold">
                  {req.profiles?.full_name || "Unknown Student"}
                </h4>
                <p className="text-stone-500">Subject: {req.subject}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleDecline(req.id, req.student_id)}
                  className="px-6 py-3 bg-stone-200 text-stone-900 rounded-xl text-xs font-bold uppercase hover:bg-stone-300 transition-all"
                >
                  Decline
                </button>
                <button 
                  onClick={() => handleAccept(req.id, req.student_id)}
                  className="px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase hover:bg-stone-900 transition-all"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}