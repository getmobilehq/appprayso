/*
  # Fix Function Search Path Security

  1. Security Improvements
    - Set immutable search_path on all functions
    - Prevent search_path manipulation attacks
    - Ensure functions always use correct schema

  2. Functions Fixed
    - toggle_prayer_request_amen
    - update_user_role
    - decrement_participant_count

  3. Changes
    - Add explicit schema qualification where needed
    - Set SECURITY DEFINER with immutable search_path
*/

-- Fix toggle_prayer_request_amen function
CREATE OR REPLACE FUNCTION public.toggle_prayer_request_amen(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if amen already exists
  IF EXISTS (
    SELECT 1 FROM public.prayer_request_amens
    WHERE prayer_request_id = request_id
    AND user_id = auth.uid()
  ) THEN
    -- Remove amen
    DELETE FROM public.prayer_request_amens
    WHERE prayer_request_id = request_id
    AND user_id = auth.uid();
    
    -- Decrement count
    UPDATE public.prayer_requests
    SET amen_count = GREATEST(0, amen_count - 1)
    WHERE id = request_id;
  ELSE
    -- Add amen
    INSERT INTO public.prayer_request_amens (prayer_request_id, user_id)
    VALUES (request_id, auth.uid());
    
    -- Increment count
    UPDATE public.prayer_requests
    SET amen_count = amen_count + 1
    WHERE id = request_id;
  END IF;
END;
$$;

-- Fix update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to update roles
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Update the user role
  UPDATE public.user_profiles
  SET role = new_role
  WHERE id = target_user_id;

  -- Log the action
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    'update_user_role',
    target_user_id,
    jsonb_build_object('new_role', new_role)
  );
END;
$$;

-- Fix decrement_participant_count function
CREATE OR REPLACE FUNCTION public.decrement_participant_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.prayer_rooms
  SET participant_count = GREATEST(0, participant_count - 1)
  WHERE id = OLD.room_id;
  
  RETURN OLD;
END;
$$;