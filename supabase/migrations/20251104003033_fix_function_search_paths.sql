/*
  # Fix Function Search Paths for Security

  1. Security Issue
    - Functions with mutable search paths are vulnerable to search_path attacks
    - Must set immutable search path or use schema-qualified references

  2. Solution
    - Add `SET search_path = public, pg_temp` to all functions
    - This makes the search path immutable and secure

  3. Functions Updated
    - toggle_prayer_request_amen
    - increment_circle_member_count
    - decrement_circle_member_count
    - is_circle_owner
    - is_circle_member
    - update_user_role
    - increment_response_count
    - update_updated_at_column
    - decrement_participant_count
    - decrement_response_count
*/

-- Toggle prayer request amen
CREATE OR REPLACE FUNCTION toggle_prayer_request_amen(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_amen_exists boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM prayer_request_amens
    WHERE prayer_request_id = request_id AND user_id = v_user_id
  ) INTO v_amen_exists;

  IF v_amen_exists THEN
    DELETE FROM prayer_request_amens
    WHERE prayer_request_id = request_id AND user_id = v_user_id;
    
    UPDATE prayer_requests
    SET amen_count = GREATEST(0, amen_count - 1)
    WHERE id = request_id;
  ELSE
    INSERT INTO prayer_request_amens (prayer_request_id, user_id)
    VALUES (request_id, v_user_id);
    
    UPDATE prayer_requests
    SET amen_count = amen_count + 1
    WHERE id = request_id;
  END IF;
END;
$$;

-- Increment circle member count
CREATE OR REPLACE FUNCTION increment_circle_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE circles
  SET member_count = member_count + 1
  WHERE id = NEW.circle_id;
  RETURN NEW;
END;
$$;

-- Decrement circle member count
CREATE OR REPLACE FUNCTION decrement_circle_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE circles
  SET member_count = GREATEST(1, member_count - 1)
  WHERE id = OLD.circle_id;
  RETURN OLD;
END;
$$;

-- Check if user is circle owner
CREATE OR REPLACE FUNCTION is_circle_owner(circle_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM circles
    WHERE id = circle_uuid AND owner_id = user_uuid
  );
END;
$$;

-- Check if user is circle member
CREATE OR REPLACE FUNCTION is_circle_member(circle_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = circle_uuid AND user_id = user_uuid
  );
END;
$$;

-- Update user role (admin function)
CREATE OR REPLACE FUNCTION update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  calling_user_id uuid;
  calling_user_role text;
BEGIN
  calling_user_id := auth.uid();
  
  SELECT role INTO calling_user_role
  FROM profiles
  WHERE id = calling_user_id;
  
  IF calling_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  IF new_role NOT IN ('user', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  
  UPDATE profiles
  SET role = new_role,
      is_admin = (new_role = 'admin')
  WHERE id = target_user_id;
END;
$$;

-- Increment response count
CREATE OR REPLACE FUNCTION increment_response_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE prayer_requests
  SET response_count = response_count + 1
  WHERE id = NEW.prayer_request_id;
  RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Decrement participant count
CREATE OR REPLACE FUNCTION decrement_participant_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE prayer_rooms
  SET participant_count = GREATEST(0, participant_count - 1)
  WHERE id = OLD.room_id;
  RETURN OLD;
END;
$$;

-- Decrement response count
CREATE OR REPLACE FUNCTION decrement_response_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE prayer_requests
  SET response_count = GREATEST(0, response_count - 1)
  WHERE id = OLD.prayer_request_id;
  RETURN OLD;
END;
$$;
