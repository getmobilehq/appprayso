-- Create room_invites table if it doesn't exist
-- This table allows hosts to invite specific users or entire circles to private rooms

CREATE TABLE IF NOT EXISTS room_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES prayer_rooms(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure either invitee_id or circle_id is set, but not both null
  CONSTRAINT invite_target_required CHECK (invitee_id IS NOT NULL OR circle_id IS NOT NULL)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_room_invites_room_id ON room_invites(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invites_invitee_id ON room_invites(invitee_id);
CREATE INDEX IF NOT EXISTS idx_room_invites_circle_id ON room_invites(circle_id);
CREATE INDEX IF NOT EXISTS idx_room_invites_status ON room_invites(status);

-- RLS Policies (these may already exist, but CREATE IF NOT EXISTS isn't available for policies)

-- Room hosts can create invitations
DROP POLICY IF EXISTS "Room hosts can create invitations" ON room_invites;
CREATE POLICY "Room hosts can create invitations"
  ON room_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prayer_rooms
      WHERE prayer_rooms.id = room_invites.room_id
      AND prayer_rooms.host_id = auth.uid()
    )
  );

-- Users can view their invitations
DROP POLICY IF EXISTS "Users can view their invitations" ON room_invites;
CREATE POLICY "Users can view their invitations"
  ON room_invites FOR SELECT
  TO authenticated
  USING (
    invitee_id = auth.uid()
    OR circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM prayer_rooms
      WHERE prayer_rooms.id = room_invites.room_id
      AND prayer_rooms.host_id = auth.uid()
    )
  );

-- Users can update their invitation status
DROP POLICY IF EXISTS "Users can update invitation status" ON room_invites;
CREATE POLICY "Users can update invitation status"
  ON room_invites FOR UPDATE
  TO authenticated
  USING (
    invitee_id = auth.uid()
    OR circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
  );

-- Room hosts can delete invitations
DROP POLICY IF EXISTS "Room hosts can delete invitations" ON room_invites;
CREATE POLICY "Room hosts can delete invitations"
  ON room_invites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prayer_rooms
      WHERE prayer_rooms.id = room_invites.room_id
      AND prayer_rooms.host_id = auth.uid()
    )
  );

-- Enable RLS
ALTER TABLE room_invites ENABLE ROW LEVEL SECURITY;
