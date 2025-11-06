/*
  # Create Notifications System

  1. New Table
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles) - recipient
      - `type` (text) - notification type
      - `title` (text) - notification title
      - `message` (text) - notification message
      - `action_url` (text) - where to redirect on click
      - `action_label` (text) - button text
      - `related_id` (uuid) - ID of related entity (circle, request, etc)
      - `is_read` (boolean) - read status
      - `created_at` (timestamptz)

  2. Notification Types
    - circle_join_request - Someone requested to join your circle
    - circle_join_approved - Your join request was approved
    - circle_join_rejected - Your join request was rejected
    - circle_invite - You were invited to a circle
    - prayer_request_response - Someone responded to your prayer
    - prayer_request_amen - Someone said amen to your prayer
    - room_invite - You were invited to a prayer room
    - room_scheduled - Room you're interested in is scheduled

  3. Security
    - Enable RLS on notifications table
    - Users can only view their own notifications
    - Users can update their own notifications (mark as read)

  4. Indexes
    - Index on user_id for fast lookups
    - Index on is_read for filtering
    - Index on created_at for sorting
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'circle_join_request',
    'circle_join_approved',
    'circle_join_rejected',
    'circle_invite',
    'prayer_request_response',
    'prayer_request_amen',
    'room_invite',
    'room_scheduled'
  )),
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  action_label text,
  related_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_action_url text DEFAULT NULL,
  p_action_label text DEFAULT NULL,
  p_related_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    action_label,
    related_id
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_related_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Trigger: Notify circle owner when join request is created
CREATE OR REPLACE FUNCTION notify_circle_join_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_circle_name text;
  v_owner_id uuid;
BEGIN
  -- Only notify for pending requests to private circles
  IF NEW.status = 'pending' THEN
    -- Get circle info
    SELECT c.name, c.owner_id INTO v_circle_name, v_owner_id
    FROM circles c
    WHERE c.id = NEW.circle_id;

    -- Don't notify for public circles (auto-approved)
    IF v_owner_id IS NOT NULL THEN
      -- Check if circle is private
      IF EXISTS (SELECT 1 FROM circles WHERE id = NEW.circle_id AND is_public = false) THEN
        PERFORM create_notification(
          v_owner_id,
          'circle_join_request',
          'New Join Request',
          NEW.user_name || ' wants to join ' || v_circle_name,
          '/circles',
          'Review Request',
          NEW.circle_id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_circle_join_request_trigger
  AFTER INSERT ON circle_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_circle_join_request();

-- Trigger: Notify user when join request is approved/rejected
CREATE OR REPLACE FUNCTION notify_join_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_circle_name text;
  v_notification_type text;
  v_title text;
  v_message text;
BEGIN
  -- Only notify on status change
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    -- Get circle name
    SELECT name INTO v_circle_name
    FROM circles
    WHERE id = NEW.circle_id;

    IF NEW.status = 'approved' THEN
      v_notification_type := 'circle_join_approved';
      v_title := 'Join Request Approved';
      v_message := 'You have been accepted to ' || v_circle_name;
    ELSE
      v_notification_type := 'circle_join_rejected';
      v_title := 'Join Request Declined';
      v_message := 'Your request to join ' || v_circle_name || ' was declined';
    END IF;

    PERFORM create_notification(
      NEW.user_id,
      v_notification_type,
      v_title,
      v_message,
      '/circles',
      'View Circles',
      NEW.circle_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_join_request_status_trigger
  AFTER UPDATE ON circle_join_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_join_request_status();

-- Trigger: Notify user when someone responds to their prayer request
CREATE OR REPLACE FUNCTION notify_prayer_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request_title text;
  v_request_user_id uuid;
BEGIN
  -- Get prayer request info
  SELECT title, user_id INTO v_request_title, v_request_user_id
  FROM prayer_requests
  WHERE id = NEW.prayer_request_id;

  -- Don't notify if user is responding to their own prayer
  IF v_request_user_id != NEW.user_id THEN
    PERFORM create_notification(
      v_request_user_id,
      'prayer_request_response',
      'New Prayer Response',
      NEW.user_name || ' responded to "' || v_request_title || '"',
      '/prayer-request/' || NEW.prayer_request_id,
      'View Response',
      NEW.prayer_request_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_prayer_response_trigger
  AFTER INSERT ON prayer_request_responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_prayer_response();

-- Trigger: Notify user when someone says amen to their prayer
CREATE OR REPLACE FUNCTION notify_prayer_amen()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request_title text;
  v_request_user_id uuid;
  v_amen_user_name text;
BEGIN
  -- Get prayer request and user info
  SELECT pr.title, pr.user_id, p.display_name
  INTO v_request_title, v_request_user_id, v_amen_user_name
  FROM prayer_requests pr
  LEFT JOIN profiles p ON p.id = NEW.user_id
  WHERE pr.id = NEW.prayer_request_id;

  -- Don't notify if user is saying amen to their own prayer
  IF v_request_user_id != NEW.user_id THEN
    PERFORM create_notification(
      v_request_user_id,
      'prayer_request_amen',
      'Someone Said Amen',
      COALESCE(v_amen_user_name, 'Someone') || ' said amen to "' || v_request_title || '"',
      '/prayer-request/' || NEW.prayer_request_id,
      'View Prayer',
      NEW.prayer_request_id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_prayer_amen_trigger
  AFTER INSERT ON prayer_request_amens
  FOR EACH ROW
  EXECUTE FUNCTION notify_prayer_amen();
