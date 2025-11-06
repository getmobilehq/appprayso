/*
  # Create Circle Join Requests Table

  1. New Table
    - `circle_join_requests`
      - `id` (uuid, primary key)
      - `circle_id` (uuid, references circles)
      - `user_id` (uuid, references profiles)
      - `user_name` (text)
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on circle_join_requests
    - Users can create join requests for themselves
    - Users can view their own join requests
    - Circle owners can view, approve, or reject requests for their circles
    - Auto-approve for public circles via trigger

  3. Indexes
    - Index on circle_id for faster lookups
    - Index on user_id for user's request history
    - Unique constraint on (circle_id, user_id, status) for pending requests
*/

-- Create circle_join_requests table
CREATE TABLE IF NOT EXISTS circle_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE circle_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own join requests
CREATE POLICY "Users can create join requests"
  ON circle_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Users can view their own join requests
CREATE POLICY "Users can view their own join requests"
  ON circle_join_requests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Circle owners can view all requests for their circles
CREATE POLICY "Circle owners can view join requests"
  ON circle_join_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_join_requests.circle_id
      AND circles.owner_id = (select auth.uid())
    )
  );

-- Circle owners can update requests (approve/reject)
CREATE POLICY "Circle owners can update join requests"
  ON circle_join_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_join_requests.circle_id
      AND circles.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_join_requests.circle_id
      AND circles.owner_id = (select auth.uid())
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_circle_join_requests_circle_id ON circle_join_requests(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_join_requests_user_id ON circle_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_join_requests_status ON circle_join_requests(status);

-- Unique constraint to prevent duplicate pending requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_circle_join_requests_unique_pending 
  ON circle_join_requests(circle_id, user_id) 
  WHERE status = 'pending';

-- Function to auto-approve and add to circle_members for public circles
CREATE OR REPLACE FUNCTION auto_approve_public_circle_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_public boolean;
BEGIN
  -- Check if circle is public
  SELECT is_public INTO v_is_public
  FROM circles
  WHERE id = NEW.circle_id;

  -- If public, auto-approve and add to circle_members
  IF v_is_public THEN
    -- Update request status to approved
    NEW.status := 'approved';
    NEW.updated_at := now();
    
    -- Add user to circle_members
    INSERT INTO circle_members (circle_id, user_id, user_name, role)
    VALUES (NEW.circle_id, NEW.user_id, NEW.user_name, 'member')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to auto-approve public circle joins
CREATE TRIGGER auto_approve_public_circle_join_trigger
  BEFORE INSERT ON circle_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_public_circle_join();

-- Function to add user to circle when request is approved
CREATE OR REPLACE FUNCTION process_approved_join_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If status changed to approved, add to circle_members
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO circle_members (circle_id, user_id, user_name, role)
    VALUES (NEW.circle_id, NEW.user_id, NEW.user_name, 'member')
    ON CONFLICT DO NOTHING;
    
    -- Update timestamp
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to process approved join requests
CREATE TRIGGER process_approved_join_request_trigger
  BEFORE UPDATE ON circle_join_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION process_approved_join_request();

-- Update updated_at timestamp
CREATE TRIGGER update_circle_join_requests_updated_at
  BEFORE UPDATE ON circle_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
