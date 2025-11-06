/*
  # Remove Duplicate Functions and Fix Search Path

  1. Security Improvements
    - Remove old function signatures without search_path set
    - Ensure all functions have immutable search_path=public
    - Eliminate function signature conflicts

  2. Functions Fixed
    - toggle_prayer_request_amen: Remove old signature with (request_id, user_id)
    - update_user_role: Remove old signature with (target_user_id, new_role, new_is_admin)
    - decrement_participant_count: Remove old signature with (room_id)

  3. Result
    - Only properly secured function signatures remain
    - All functions have SET search_path = public
*/

-- Drop old function signatures without search_path
DROP FUNCTION IF EXISTS public.toggle_prayer_request_amen(uuid, uuid);
DROP FUNCTION IF EXISTS public.update_user_role(uuid, text, boolean);
DROP FUNCTION IF EXISTS public.decrement_participant_count(uuid);

-- Verify the correct functions still exist with search_path set
-- These were created in the previous migration and should have search_path = public