import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("announcements")
      .select(`
        id, title, body, pinned, target_role, created_at,
        author:profiles!announcements_author_id_fkey(full_name)
      `)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    setAnnouncements(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel("announcements-view-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-10 h-10 border-4 border-stone-100 border-t-black rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Loading notices...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-4xl font-playfair font-bold text-stone-900">Notices</h2>
        <p className="text-stone-500 mt-2">Announcements and updates from the leadership team.</p>
      </header>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-[3rem] border-2 border-dashed border-stone-200 p-16 text-center">
          <p className="text-3xl mb-4">📢</p>
          <p className="text-stone-400 italic font-medium">No announcements yet.</p>
          <p className="text-stone-400 text-sm mt-2">Check back later for updates from the team.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-3xl border p-8 shadow-sm transition-all ${
                ann.pinned ? "border-black ring-1 ring-black/10" : "border-stone-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {ann.pinned && (
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-black text-white px-3 py-1 rounded-full">
                      Pinned
                    </span>
                  )}
                  {ann.target_role !== "all" && (
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-stone-100 text-stone-600 px-3 py-1 rounded-full">
                      {ann.target_role}s only
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-400 whitespace-nowrap shrink-0">{timeAgo(ann.created_at)}</p>
              </div>
              <h3 className="text-xl font-playfair font-bold text-stone-900 mb-2">{ann.title}</h3>
              <p className="text-stone-600 leading-relaxed">{ann.body}</p>
              <p className="text-[10px] text-stone-400 mt-4 uppercase tracking-wider font-bold">
                — {ann.author?.full_name ?? "Leadership"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
