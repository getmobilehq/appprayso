-- Clear all existing rooms and related data
-- This is a one-time cleanup script before Phase 2

-- Delete room messages first (foreign key constraint)
DELETE FROM room_messages;

-- Delete room speakers
DELETE FROM room_speakers;

-- Delete all rooms
DELETE FROM prayer_rooms;

-- Reset any sequences if needed (optional)
-- This ensures new rooms start with clean IDs
