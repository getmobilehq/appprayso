/*
  # Remove Duplicate RLS Policies

  1. Issue
    - Multiple permissive policies on same table/action cause confusion
    - Policies should be consolidated for clarity and performance

  2. Changes
    - Remove old/duplicate policies
    - Keep only the optimized versions from previous migration

  3. Affected Tables
    - circle_members (DELETE)
    - prayer_requests (INSERT, SELECT)
    - prayer_rooms (SELECT)
    - room_messages (INSERT, SELECT)
*/

-- Remove duplicate DELETE policies from circle_members
-- Keep: "Circle owners can remove members" and "Members can leave circles"
-- Both are needed for different use cases

-- Remove old INSERT policy from prayer_requests (duplicate)
DROP POLICY IF EXISTS "Anyone can create prayer requests" ON prayer_requests;

-- Remove old SELECT policy from prayer_requests (duplicate)
DROP POLICY IF EXISTS "Anyone can view prayer requests" ON prayer_requests;

-- Remove old SELECT policy from prayer_rooms (duplicate)
DROP POLICY IF EXISTS "Anyone can view active prayer rooms" ON prayer_rooms;

-- Remove old INSERT policy from room_messages (duplicate)  
DROP POLICY IF EXISTS "Users can send messages" ON room_messages;

-- Remove old SELECT policy from room_messages (duplicate)
DROP POLICY IF EXISTS "Users can view messages in rooms" ON room_messages;

-- Note: The optimized versions of these policies were created in the previous migration
-- This ensures we only have one policy per action per role
