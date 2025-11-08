-- Add co-host support to prayer_rooms table
ALTER TABLE prayer_rooms ADD COLUMN IF NOT EXISTS co_hosts UUID[] DEFAULT '{}';

-- Add index for co-host lookups
CREATE INDEX IF NOT EXISTS idx_prayer_rooms_co_hosts ON prayer_rooms USING GIN(co_hosts);

-- Function to check if user is host or co-host
CREATE OR REPLACE FUNCTION is_room_host_or_cohost(room_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM prayer_rooms
    WHERE id = room_uuid
    AND (host_id = user_uuid OR user_uuid = ANY(co_hosts))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer host (adds old host as co-host)
CREATE OR REPLACE FUNCTION transfer_room_host(
  room_uuid UUID,
  new_host_uuid UUID,
  old_host_uuid UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE prayer_rooms
  SET
    host_id = new_host_uuid,
    co_hosts = array_append(
      array_remove(co_hosts, new_host_uuid), -- Remove new host from co-hosts if present
      old_host_uuid -- Add old host to co-hosts
    )
  WHERE id = room_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add co-host
CREATE OR REPLACE FUNCTION add_room_cohost(
  room_uuid UUID,
  user_uuid UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE prayer_rooms
  SET co_hosts = array_append(co_hosts, user_uuid)
  WHERE id = room_uuid
  AND NOT (user_uuid = ANY(co_hosts)) -- Don't add duplicates
  AND host_id != user_uuid; -- Don't add host as co-host
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove co-host
CREATE OR REPLACE FUNCTION remove_room_cohost(
  room_uuid UUID,
  user_uuid UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE prayer_rooms
  SET co_hosts = array_remove(co_hosts, user_uuid)
  WHERE id = room_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
