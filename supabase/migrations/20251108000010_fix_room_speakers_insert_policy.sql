-- Allow users to add themselves to room_speakers when joining
-- This fixes the 400 error when users try to join rooms

-- Add policy to allow users to insert themselves into room_speakers
DROP POLICY IF EXISTS "Users can add themselves when joining rooms" ON room_speakers;
CREATE POLICY "Users can add themselves when joining rooms"
  ON room_speakers FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM prayer_rooms
      WHERE prayer_rooms.id = room_speakers.room_id
      AND (
        -- Public rooms: anyone can join
        NOT prayer_rooms.is_private
        -- Private rooms: must be host, circle member, or invited
        OR prayer_rooms.host_id = auth.uid()
        OR prayer_rooms.circle_id IN (
          SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM room_invites
          WHERE room_invites.room_id = prayer_rooms.id
          AND room_invites.invitee_id = auth.uid()
          AND room_invites.status = 'pending'
        )
      )
    )
  );

-- Add unique constraint to prevent duplicate entries
-- This allows upsert to work properly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'room_speakers_room_user_unique'
  ) THEN
    ALTER TABLE room_speakers
    ADD CONSTRAINT room_speakers_room_user_unique
    UNIQUE (room_id, user_id);
  END IF;
END $$;
