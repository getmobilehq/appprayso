/*
  # Fix Multiple Permissive RLS Policies

  1. Security Improvements
    - Consolidate multiple permissive policies into single policies
    - Prevent policy conflicts and improve security clarity
    - Ensure proper access control without redundancy

  2. Tables Fixed
    - circle_join_requests: Merge duplicate SELECT policies
    - circle_members: Merge duplicate DELETE policies  
    - prayer_requests: Remove duplicate INSERT policy

  3. Changes
    - Replace multiple permissive policies with single comprehensive policies
    - Maintain same access control logic but in cleaner structure
*/

-- Fix circle_join_requests multiple SELECT policies
DROP POLICY IF EXISTS "Circle owners can view join requests" ON circle_join_requests;
DROP POLICY IF EXISTS "Users can view their own join requests" ON circle_join_requests;

CREATE POLICY "Users can view relevant join requests"
  ON circle_join_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_join_requests.circle_id
      AND circles.owner_id = auth.uid()
    )
  );

-- Fix circle_members multiple DELETE policies
DROP POLICY IF EXISTS "Circle owners can remove members" ON circle_members;
DROP POLICY IF EXISTS "Members can leave circles" ON circle_members;

CREATE POLICY "Users can manage circle membership"
  ON circle_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_members.circle_id
      AND circles.owner_id = auth.uid()
    )
  );

-- Fix prayer_requests multiple INSERT policies
DROP POLICY IF EXISTS "Users can create prayer requests" ON prayer_requests;
DROP POLICY IF EXISTS "Users can create their own prayer requests" ON prayer_requests;

CREATE POLICY "Authenticated users can create prayer requests"
  ON prayer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);