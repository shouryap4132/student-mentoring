import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { appendConversationMessage } from "../lib/chat";

export default function Messaging() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConvId = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let messagesChannel: any;
    let convoChannel: any;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const uid = session.user.id;
      setUserId(uid);
      userIdRef.current = uid;
      await fetchConversations(uid);
      setLoading(false);

      messagesChannel = supabase
        .channel("messages-realtime")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
          if (payload.new.conversation_id === selectedConvId.current) {
            setMessages((prev) => [...prev, payload.new]);
            if (payload.new.sender_id !== userIdRef.current) {
              supabase.from("messages").update({ read: true }).eq("id", payload.new.id).then(() => {});
            }
          }
          if (userIdRef.current) fetchConversations(userIdRef.current);
        })
        .subscribe();

      convoChannel = supabase
        .channel("conversations-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
          if (userIdRef.current) fetchConversations(userIdRef.current);
        })
        .subscribe();
    }

    init();
    return () => {
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      if (convoChannel) supabase.removeChannel(convoChannel);
    };
  }, []);

  const fetchConversations = async (uid: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id, participant1_id, participant2_id, last_message, last_message_at,
        p1:profiles!conversations_participant1_id_fkey(full_name, avatar_url),
        p2:profiles!conversations_participant2_id_fkey(full_name, avatar_url)
      `)
      .or(`participant1_id.eq.${uid},participant2_id.eq.${uid}`)
      .order("last_message_at", { ascending: false });

    if (!error) setConversations(data ?? []);
  };

  const selectConversation = async (conv: any) => {
    setSelected(conv);
    selectedConvId.current = conv.id;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
    if (userId) {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", userId);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selected || !userId) return;
    setSending(true);
    const { error } = await appendConversationMessage(selected.id, userId, text);
    if (error) toast.error("Failed to send message");
    else setText("");
    setSending(false);
  };

  const otherParticipant = (conv: any) =>
    conv.participant1_id === userId ? conv.p2 : conv.p1;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex gap-6 h-[600px]">
      {/* SIDEBAR */}
      <div className="w-80 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h2 className="text-xl font-playfair font-bold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-6 text-sm text-stone-400 text-center">No conversations yet</p>
          ) : (
            conversations.map((conv) => {
              const other = otherParticipant(conv);
              const isSelected = selected?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-4 border-b border-stone-100 text-left transition-colors ${
                    isSelected ? "bg-stone-100" : "hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} alt={other.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold">{other?.full_name?.[0] ?? "?"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-900 truncate">{other?.full_name}</p>
                      <p className="text-xs text-stone-400 truncate">{conv.last_message || "No messages yet"}</p>
                    </div>
                  </div>
                  {conv.last_message_at && (
                    <p className="text-[10px] text-stone-300 mt-1">{timeAgo(conv.last_message_at)}</p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MESSAGES PANE */}
      {selected ? (
        <div className="flex-1 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden">
              {otherParticipant(selected)?.avatar_url ? (
                <img src={otherParticipant(selected).avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-stone-400">{otherParticipant(selected)?.full_name?.[0] ?? "?"}</span>
              )}
            </div>
            <h3 className="text-lg font-bold">{otherParticipant(selected)?.full_name}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-stone-400 text-sm italic py-8">No messages yet. Say hello!</p>
            )}
            {messages.map((msg) => {
              const isOwn = msg.sender_id === userId;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${
                    isOwn ? "bg-black text-white rounded-br-none" : "bg-stone-100 text-stone-900 rounded-bl-none"
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isOwn ? "text-stone-400" : "text-stone-500"}`}>
                      {timeAgo(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="p-6 border-t border-stone-100 flex gap-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-stone-100 border border-stone-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black transition-all"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="px-6 py-3 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-3xl border border-stone-200 shadow-sm flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-stone-400 italic">Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
