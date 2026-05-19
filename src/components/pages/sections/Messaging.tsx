import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../../utils/supabaseClient";

export default function Messaging() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Initialize session and load conversations
  useEffect(() => {
    async function initializeMessaging() {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      setSession(currentSession);
      await fetchConversations(currentSession.user.id);
      setLoading(false);

      // REALTIME LISTENER for messages
      const messagesChannel = supabase
        .channel("messages-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            console.log("New message received!", payload);
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      // REALTIME LISTENER for conversations (new ones or updated timestamps)
      const conversationsChannel = supabase
        .channel("conversations-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "conversations" },
          () => {
            console.log("Conversation updated!");
            fetchConversations(currentSession.user.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(conversationsChannel);
      };
    }

    initializeMessaging();
  }, []);

  const fetchConversations = async (userId: string) => {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        id,
        participant1_id,
        participant2_id,
        last_message,
        last_message_at,
        profiles1:participant1_id(full_name, avatar_url),
        profiles2:participant2_id(full_name, avatar_url)
      `
      )
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch conversations:", error);
      return;
    }

    setConversations(data || []);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch messages:", error);
      return;
    }

    setMessages(data || []);

    // Mark messages as read
    if (session) {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", session.user.id);
    }
  };

  const selectConversation = async (conv: any) => {
    setSelectedConversation(conv);
    await fetchMessages(conv.id);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: selectedConversation.id,
        sender_id: session.user.id,
        content: messageText,
        read: false,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } else {
      setMessageText("");
      // The realtime listener will add it to messages
    }

    setSending(false);
  };

  const getOtherParticipant = (conv: any) => {
    if (conv.participant1_id === session?.user.id) {
      return conv.profiles2 || { full_name: "Unknown" };
    }
    return conv.profiles1 || { full_name: "Unknown" };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[600px] bg-stone-50">
      {/* CONVERSATIONS LIST */}
      <div className="w-80 bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm flex flex-col">
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-xl font-playfair font-bold">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-stone-400 text-sm">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-4 border-b border-stone-100 text-left transition-colors ${
                    isSelected ? "bg-stone-100" : "hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                      {other.avatar_url ? (
                        <img
                          src={other.avatar_url}
                          alt={other.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">
                          {other.full_name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-900">{other.full_name}</p>
                      <p className="text-xs text-stone-500 truncate">{conv.last_message}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2">
                    {formatTime(conv.last_message_at)}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MESSAGES PANE */}
      {selectedConversation ? (
        <div className="flex-1 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
          {/* HEADER */}
          <div className="p-6 border-b border-stone-200">
            <h3 className="text-lg font-bold">
              {getOtherParticipant(selectedConversation).full_name}
            </h3>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === session?.user.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl ${
                      isOwn
                        ? "bg-black text-white rounded-br-none"
                        : "bg-stone-100 text-stone-900 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-stone-400" : "text-stone-500"
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MESSAGE INPUT */}
          <form onSubmit={sendMessage} className="p-6 border-t border-stone-200">
            <div className="flex gap-3">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-stone-100 border border-stone-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black transition-all text-sm"
              />
              <button
                type="submit"
                disabled={sending || !messageText.trim()}
                className="px-6 py-3 bg-black text-white rounded-2xl font-bold text-xs uppercase disabled:opacity-50 transition-all"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-3xl border border-stone-200 shadow-sm flex items-center justify-center">
          <p className="text-stone-400">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
}
