-- Function to automatically assign next host when current host leaves (circles only)
CREATE OR REPLACE FUNCTION auto_assign_next_host(room_uuid UUID)
RETURNS UUID AS $$
DECLARE
  circle_id_var UUID;
  new_host_id UUID;
  room_host_id UUID;
BEGIN
  -- Get room details
  SELECT circle_id, host_id INTO circle_id_var, room_host_id
  FROM prayer_rooms
  WHERE id = room_uuid;

  -- Only auto-assign for circle rooms
  IF circle_id_var IS NULL THEN
    RETURN NULL;
  END IF;

  -- Priority 1: Existing co-hosts who are in the room
  SELECT user_id INTO new_host_id
  FROM room_speakers rp
  WHERE rp.room_id = room_uuid
  AND rp.user_id = ANY(
    SELECT unnest(co_hosts) FROM prayer_rooms WHERE id = room_uuid
  )
  LIMIT 1;

  IF new_host_id IS NOT NULL THEN
    RETURN new_host_id;
  END IF;

  -- Priority 2: Circle admin (if in the room)
  SELECT rp.user_id INTO new_host_id
  FROM room_speakers rp
  JOIN circles c ON c.id = circle_id_var
  WHERE rp.room_id = room_uuid
  AND rp.user_id = c.created_by
  LIMIT 1;

  IF new_host_id IS NOT NULL THEN
    RETURN new_host_id;
  END IF;

  -- Priority 3: Longest circle member (by join date) who is in the room
  SELECT rp.user_id INTO new_host_id
  FROM room_speakers rp
  JOIN circle_members cm ON cm.user_id = rp.user_id AND cm.circle_id = circle_id_var
  WHERE rp.room_id = room_uuid
  AND cm.status = 'active'
  ORDER BY cm.joined_at ASC
  LIMIT 1;

  RETURN new_host_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle host disconnect and reassign
CREATE OR REPLACE FUNCTION handle_host_disconnect(
  room_uuid UUID,
  disconnected_host_uuid UUID
)
RETURNS TABLE(new_host_id UUID, should_transfer BOOLEAN) AS $$
DECLARE
  current_host_id UUID;
  next_host UUID;
BEGIN
  -- Get current host
  SELECT host_id INTO current_host_id
  FROM prayer_rooms
  WHERE id = room_uuid;

  -- Only proceed if the disconnected user is actually the host
  IF current_host_id != disconnected_host_uuid THEN
    RETURN QUERY SELECT NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Find next host
  SELECT auto_assign_next_host(room_uuid) INTO next_host;

  -- If we found a new host, transfer
  IF next_host IS NOT NULL THEN
    UPDATE prayer_rooms
    SET host_id = next_host,
        co_hosts = array_append(
          array_remove(co_hosts, next_host),
          disconnected_host_uuid
        )
    WHERE id = room_uuid;

    RETURN QUERY SELECT next_host, TRUE;
  ELSE
    -- No one to transfer to
    RETURN QUERY SELECT NULL::UUID, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
