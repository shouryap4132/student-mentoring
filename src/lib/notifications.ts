import { supabase } from "./supabase";

export type EmailNotificationPayload = {
  recipient_user_id?: string | null;
  recipient_email?: string | null;
  subject: string;
  body: string;
  metadata?: any;
};

export const queueEmailNotification = async ({
  recipient_user_id,
  recipient_email,
  subject,
  body,
  metadata,
}: EmailNotificationPayload) => {
  let email = recipient_email;

  if (!email && recipient_user_id) {
    const { data } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", recipient_user_id)
      .maybeSingle();
    if (!data?.email) return { error: new Error("Recipient email not found") };
    email = data.email;
  }

  if (!email) return { error: new Error("No recipient email provided") };

  const { error } = await supabase.from("email_queue").insert([
    { recipient_user_id: recipient_user_id ?? null, recipient_email: email, subject, body, status: "pending", metadata },
  ]);
  return { error };
};

export const queueInAppNotification = async ({
  user_id,
  title,
  body,
  link,
}: {
  user_id: string;
  title: string;
  body: string;
  link?: string;
}) => {
  const { error } = await supabase.from("notifications").insert([
    { user_id, title, body, link: link ?? null, read: false },
  ]);
  return { error };
};
