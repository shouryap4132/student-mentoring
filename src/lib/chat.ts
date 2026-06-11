import { supabase } from "./supabase";

export const getOrCreateConversation = async (userId: string, otherUserId: string) => {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .or(
      `and(participant1_id.eq.${userId},participant2_id.eq.${otherUserId}),` +
      `and(participant1_id.eq.${otherUserId},participant2_id.eq.${userId})`
    )
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error };
  if (data) return { data, error: null };

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert([{ participant1_id: userId, participant2_id: otherUserId }])
    .select()
    .maybeSingle();

  return { data: created, error: createError };
};

export const appendConversationMessage = async (
  conversationId: string,
  senderId: string,
  content: string
) => {
  const { error: msgError } = await supabase.from("messages").insert([
    { conversation_id: conversationId, sender_id: senderId, content, read: false },
  ]);
  if (msgError) return { error: msgError };

  const { error: convoError } = await supabase
    .from("conversations")
    .update({ last_message: content, last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { error: convoError };
};
