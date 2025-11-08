-- Create room moderation logs table to track host actions
CREATE TABLE IF NOT EXISTS room_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES prayer_rooms(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('mute', 'unmute', 'remove', 'host_transfer')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_moderation_logs_room_id ON room_moderation_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON room_moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON room_moderation_logs(created_at DESC);

-- Enable RLS
ALTER TABLE room_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Room participants can view moderation logs for their room
CREATE POLICY "Room participants can view moderation logs"
  ON room_moderation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_speakers
      WHERE room_speakers.room_id = room_moderation_logs.room_id
      AND room_speakers.user_id = auth.uid()
    )
  );

-- Policy: Room hosts can insert moderation logs
CREATE POLICY "Room hosts can insert moderation logs"
  ON room_moderation_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = moderator_id
    AND EXISTS (
      SELECT 1 FROM prayer_rooms
      WHERE prayer_rooms.id = room_moderation_logs.room_id
      AND prayer_rooms.host_id = auth.uid()
    )
  );
