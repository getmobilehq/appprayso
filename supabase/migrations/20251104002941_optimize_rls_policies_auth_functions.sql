/*
  # Optimize RLS Policies for Performance

  1. Performance Improvements
    - Replace `auth.uid()` with `(select auth.uid())` in RLS policies
    - Prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  2. Tables Updated
    - profiles
    - prayer_rooms
    - prayer_requests
    - prayer_request_amens
    - prayer_request_responses
    - room_messages
    - circles
    - circle_members
    - room_invites
    - room_speakers
    - security_audit_log

  3. Note
    - This migration drops and recreates policies with optimized auth checks
    - All security rules remain identical, only performance is improved
*/

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- PRAYER ROOMS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create prayer rooms" ON prayer_rooms;
CREATE POLICY "Authenticated users can create prayer rooms"
  ON prayer_rooms FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = host_id);

DROP POLICY IF EXISTS "Hosts can update their own rooms" ON prayer_rooms;
CREATE POLICY "Hosts can update their own rooms"
  ON prayer_rooms FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = host_id)
  WITH CHECK ((select auth.uid()) = host_id);

DROP POLICY IF EXISTS "Hosts can delete their own rooms" ON prayer_rooms;
CREATE POLICY "Hosts can delete their own rooms"
  ON prayer_rooms FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = host_id);

DROP POLICY IF EXISTS "Users can view accessible rooms" ON prayer_rooms;
CREATE POLICY "Users can view accessible rooms"
  ON prayer_rooms FOR SELECT
  TO authenticated
  USING (
    NOT is_private
    OR host_id = (select auth.uid())
    OR circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM room_invites 
      WHERE room_invites.room_id = prayer_rooms.id 
      AND (room_invites.invitee_id = (select auth.uid()) OR room_invites.circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
      ))
    )
  );

-- ============================================================================
-- PRAYER REQUESTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can create their own prayer requests" ON prayer_requests;
CREATE POLICY "Users can create their own prayer requests"
  ON prayer_requests FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own prayer requests" ON prayer_requests;
CREATE POLICY "Users can update their own prayer requests"
  ON prayer_requests FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own prayer requests" ON prayer_requests;
CREATE POLICY "Users can delete their own prayer requests"
  ON prayer_requests FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view accessible prayer requests" ON prayer_requests;
CREATE POLICY "Users can view accessible prayer requests"
  ON prayer_requests FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR user_id = (select auth.uid())
    OR (visibility = 'circle' AND circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
    ))
  );

DROP POLICY IF EXISTS "Users can create prayer requests" ON prayer_requests;
CREATE POLICY "Users can create prayer requests"
  ON prayer_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND (
      visibility = 'public'
      OR visibility = 'private'
      OR (visibility = 'circle' AND circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
      ))
    )
  );

-- ============================================================================
-- PRAYER REQUEST AMENS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can give amen" ON prayer_request_amens;
CREATE POLICY "Users can give amen"
  ON prayer_request_amens FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove their own amen" ON prayer_request_amens;
CREATE POLICY "Users can remove their own amen"
  ON prayer_request_amens FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PRAYER REQUEST RESPONSES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can create responses" ON prayer_request_responses;
CREATE POLICY "Users can create responses"
  ON prayer_request_responses FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own responses" ON prayer_request_responses;
CREATE POLICY "Users can delete their own responses"
  ON prayer_request_responses FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- ROOM MESSAGES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can send messages" ON room_messages;
CREATE POLICY "Users can send messages"
  ON room_messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own messages" ON room_messages;
CREATE POLICY "Users can delete their own messages"
  ON room_messages FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Room participants can read messages" ON room_messages;
CREATE POLICY "Room participants can read messages"
  ON room_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_messages.room_id
      AND (
        NOT prayer_rooms.is_private
        OR prayer_rooms.host_id = (select auth.uid())
        OR prayer_rooms.circle_id IN (
          SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM room_invites
          WHERE room_invites.room_id = prayer_rooms.id
          AND (
            room_invites.invitee_id = (select auth.uid())
            OR room_invites.circle_id IN (
              SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Room participants can create messages" ON room_messages;
CREATE POLICY "Room participants can create messages"
  ON room_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_messages.room_id
      AND (
        NOT prayer_rooms.is_private
        OR prayer_rooms.host_id = (select auth.uid())
        OR prayer_rooms.circle_id IN (
          SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM room_invites
          WHERE room_invites.room_id = prayer_rooms.id
          AND (
            room_invites.invitee_id = (select auth.uid())
            OR room_invites.circle_id IN (
              SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
            )
          )
        )
      )
    )
  );

-- ============================================================================
-- CIRCLES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can create circles" ON circles;
CREATE POLICY "Users can create circles"
  ON circles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Circle owners can update their circles" ON circles;
CREATE POLICY "Circle owners can update their circles"
  ON circles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Circle owners can delete their circles" ON circles;
CREATE POLICY "Circle owners can delete their circles"
  ON circles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Users can view circles they own, public circles, or circles the" ON circles;
CREATE POLICY "Users can view circles they own, public circles, or circles the"
  ON circles FOR SELECT
  TO authenticated
  USING (
    owner_id = (select auth.uid())
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM circle_members 
      WHERE circle_members.circle_id = circles.id 
      AND circle_members.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- CIRCLE MEMBERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Circle owners can remove members" ON circle_members;
CREATE POLICY "Circle owners can remove members"
  ON circle_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circles 
      WHERE circles.id = circle_members.circle_id 
      AND circles.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Members can leave circles" ON circle_members;
CREATE POLICY "Members can leave circles"
  ON circle_members FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can join circles or owners can add members" ON circle_members;
CREATE POLICY "Users can join circles or owners can add members"
  ON circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM circles 
      WHERE circles.id = circle_members.circle_id 
      AND circles.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view circle members" ON circle_members;
CREATE POLICY "Users can view circle members"
  ON circle_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circles 
      WHERE circles.id = circle_members.circle_id 
      AND (
        circles.owner_id = (select auth.uid())
        OR circles.is_public = true
        OR EXISTS (
          SELECT 1 FROM circle_members cm
          WHERE cm.circle_id = circles.id 
          AND cm.user_id = (select auth.uid())
        )
      )
    )
  );

-- ============================================================================
-- ROOM INVITES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Room hosts can create invitations" ON room_invites;
CREATE POLICY "Room hosts can create invitations"
  ON room_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_invites.room_id 
      AND prayer_rooms.host_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their invitations" ON room_invites;
CREATE POLICY "Users can view their invitations"
  ON room_invites FOR SELECT
  TO authenticated
  USING (
    invitee_id = (select auth.uid())
    OR circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_invites.room_id 
      AND prayer_rooms.host_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Room hosts can delete invitations" ON room_invites;
CREATE POLICY "Room hosts can delete invitations"
  ON room_invites FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_invites.room_id 
      AND prayer_rooms.host_id = (select auth.uid())
    )
  );

-- ============================================================================
-- ROOM SPEAKERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Room hosts can add speakers" ON room_speakers;
CREATE POLICY "Room hosts can add speakers"
  ON room_speakers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_speakers.room_id 
      AND prayer_rooms.host_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view speakers in accessible rooms" ON room_speakers;
CREATE POLICY "Users can view speakers in accessible rooms"
  ON room_speakers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_speakers.room_id
      AND (
        NOT prayer_rooms.is_private
        OR prayer_rooms.host_id = (select auth.uid())
        OR prayer_rooms.circle_id IN (
          SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM room_invites
          WHERE room_invites.room_id = prayer_rooms.id
          AND (
            room_invites.invitee_id = (select auth.uid())
            OR room_invites.circle_id IN (
              SELECT circle_id FROM circle_members WHERE user_id = (select auth.uid())
            )
          )
        )
      )
    )
  );

DROP POLICY IF EXISTS "Room hosts can update speaker roles" ON room_speakers;
CREATE POLICY "Room hosts can update speaker roles"
  ON room_speakers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_speakers.room_id 
      AND prayer_rooms.host_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_speakers.room_id 
      AND prayer_rooms.host_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Room hosts can remove speakers" ON room_speakers;
CREATE POLICY "Room hosts can remove speakers"
  ON room_speakers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM prayer_rooms 
      WHERE prayer_rooms.id = room_speakers.room_id 
      AND prayer_rooms.host_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECURITY AUDIT LOG TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON security_audit_log;
CREATE POLICY "Admins can view audit logs"
  ON security_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = (select auth.uid()) 
      AND profiles.role = 'admin'
    )
  );
