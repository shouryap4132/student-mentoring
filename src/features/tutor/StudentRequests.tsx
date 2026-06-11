import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { queueEmailNotification } from "../../lib/notifications";

export default function StudentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("requests")
      .select(`id, subject, status, tutor_id, student_id, student:profiles!requests_student_id_fkey(full_name, grade_level)`)
      .eq("tutor_id", session.user.id)
      .eq("status", "pending");

    if (!error) setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAccept = async (requestId: string, studentId: string) => {
    const { error } = await supabase.from("requests").update({ status: "accepted" }).eq("id", requestId);
    if (error) { toast.error("Error accepting request: " + error.message); return; }
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    await queueEmailNotification({
      recipient_user_id: studentId,
      subject: "Your tutoring request was accepted",
      body: "Your tutor accepted your request. Check your dashboard for scheduling details.",
      metadata: { event: "request_accepted", request_id: requestId },
    });
    toast.success("Request accepted!");
  };

  const handleDecline = async (requestId: string, studentId: string) => {
    const { error } = await supabase.from("requests").update({ status: "declined" }).eq("id", requestId);
    if (error) { toast.error("Error declining request: " + error.message); return; }
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    await queueEmailNotification({
      recipient_user_id: studentId,
      subject: "Your tutoring request was declined",
      body: "Your tutor declined the request. You can request another tutor or try again later.",
      metadata: { event: "request_declined", request_id: requestId },
    });
    toast.success("Request declined.");
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-playfair font-bold">Student Requests</h2>
      {requests.length === 0 ? (
        <div className="p-10 border-2 border-dashed rounded-3xl text-center text-stone-400">No pending requests.</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="p-6 bg-white border border-stone-200 rounded-3xl shadow-sm flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Incoming Request</p>
                <h4 className="text-xl font-bold mt-1">{req.student?.full_name || "Unknown Student"}</h4>
                {req.student?.grade_level && <p className="text-sm text-stone-400">{req.student.grade_level}</p>}
                <p className="text-stone-500 mt-1">Subject: {req.subject}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleDecline(req.id, req.student_id)}
                  className="px-6 py-3 bg-stone-200 text-stone-900 rounded-xl text-xs font-bold uppercase hover:bg-stone-300 transition-all">
                  Decline
                </button>
                <button onClick={() => handleAccept(req.id, req.student_id)}
                  className="px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase hover:bg-stone-900 transition-all">
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
