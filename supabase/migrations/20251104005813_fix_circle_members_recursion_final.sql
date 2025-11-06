/*
  # Fix Circle Members Infinite Recursion

  1. Problem
    - The "Users can view circle members" policy has infinite recursion
    - It queries circle_members within a SELECT policy on circle_members
    - Error: "infinite recursion detected in policy for relation circle_members"

  2. Solution
    - Replace the recursive policy with a non-recursive version
    - Check circle ownership and membership without self-referencing
    - Allow viewing members if:
      - User owns the circle
      - User is viewing their own membership record
      - Circle is public

  3. Security
    - Maintains proper access control
    - No performance degradation
    - Eliminates infinite recursion
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view circle members" ON circle_members;

-- Create new non-recursive SELECT policy
CREATE POLICY "Users can view circle members"
  ON circle_members FOR SELECT
  TO authenticated
  USING (
    -- User owns the circle
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_members.circle_id
      AND circles.owner_id = (select auth.uid())
    )
    OR
    -- User is viewing their own membership
    user_id = (select auth.uid())
    OR
    -- Circle is public
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_members.circle_id
      AND circles.is_public = true
    )
  );
