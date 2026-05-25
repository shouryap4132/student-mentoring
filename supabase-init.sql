-- Reset and recreate the mentoring app schema

-- Drop existing app tables
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS hours_logs CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'tutor', 'leadership', 'master')),
  grade_level text,
  subjects text[] NOT NULL DEFAULT '{}',
  bio text DEFAULT '',
  avatar_url text,
  qualifications text DEFAULT '',
  availability text DEFAULT '',
  profile_complete boolean NOT NULL DEFAULT false,
  goal_hours integer NOT NULL DEFAULT 30,
  avg_rating numeric(3,2) NOT NULL DEFAULT 5.00,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate requests table
CREATE TABLE requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'scheduled', 'completed', 'declined')),
  meeting_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate hours_logs table
CREATE TABLE hours_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  hours numeric(5,2) NOT NULL,
  subject text NOT NULL,
  notes text,
  approved boolean NOT NULL DEFAULT false,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_idx
  ON conversations (LEAST(participant1_id, participant2_id), GREATEST(participant1_id, participant2_id));

-- Recreate messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate email queue table
CREATE TABLE email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS requests_student_idx ON requests (student_id);
CREATE INDEX IF NOT EXISTS requests_tutor_idx ON requests (tutor_id);
CREATE INDEX IF NOT EXISTS hours_logs_student_idx ON hours_logs (student_id);
CREATE INDEX IF NOT EXISTS hours_logs_tutor_idx ON hours_logs (tutor_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id);
CREATE INDEX IF NOT EXISTS email_queue_recipient_idx ON email_queue (recipient_user_id);

-- Table to capture trigger errors when creating profiles from auth.users
CREATE TABLE IF NOT EXISTS public.auth_trigger_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text,
  error_detail text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Defensive trigger to create profile on auth.user insert
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NULLIF(NEW.raw_user_meta_data::jsonb->> 'full_name', ''),
        NULLIF(NEW.user_metadata::jsonb->> 'full_name', ''),
        NEW.email
      ),
      now()
    );
  EXCEPTION WHEN unique_violation THEN
    NULL;
  WHEN others THEN
    BEGIN
      -- Attempt to log exception details for debugging; swallow any error here.
      INSERT INTO public.auth_trigger_errors (error_message, error_detail, payload, created_at)
      VALUES (SQLERRM, SQLSTATE, row_to_json(NEW), now());
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auth_user_created ON auth.users;
CREATE TRIGGER trigger_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();
