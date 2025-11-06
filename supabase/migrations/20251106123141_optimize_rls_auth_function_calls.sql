/*
  # Optimize RLS Auth Function Calls

  1. Performance Improvements
    - Replace auth.uid() with (SELECT auth.uid()) in RLS policies
    - Prevent re-evaluation of auth functions for each row
    - Significantly improve query performance at scale

  2. Policies Optimized
    - prayer_requests: "Authenticated users can create prayer requests"
    - circle_members: "Users can manage circle membership"
    - circle_join_requests: "Users can view relevant join requests"

  3. Technical Details
    - Using SELECT subquery ensures auth function is evaluated once per query
    - Without SELECT, function is evaluated once per row (expensive)
*/

-- Optimize prayer_requests INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create prayer requests" ON prayer_requests;

CREATE POLICY "Authenticated users can create prayer requests"
  ON prayer_requests
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Optimize circle_members DELETE policy
DROP POLICY IF EXISTS "Users can manage circle membership" ON circle_members;

CREATE POLICY "Users can manage circle membership"
  ON circle_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_members.circle_id
      AND circles.owner_id = (SELECT auth.uid())
    )
  );

-- Optimize circle_join_requests SELECT policy
DROP POLICY IF EXISTS "Users can view relevant join requests" ON circle_join_requests;

CREATE POLICY "Users can view relevant join requests"
  ON circle_join_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_join_requests.circle_id
      AND circles.owner_id = (SELECT auth.uid())
    )
  );