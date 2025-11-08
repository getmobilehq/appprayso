-- Clear all demo data for beta testing
-- This migration removes all rooms, circles, and related data
-- User profiles and authentication data are preserved

-- Delete all room-related data (in dependency order)
DELETE FROM room_moderation_logs;
DELETE FROM room_invites;
DELETE FROM room_messages;
DELETE FROM room_speakers;
DELETE FROM prayer_rooms;

-- Delete all circle-related data (in dependency order)
DELETE FROM circle_join_requests;
DELETE FROM circle_members;
DELETE FROM circles;

-- Delete all prayer requests and responses
DELETE FROM prayer_request_responses;
DELETE FROM prayer_request_amens;
DELETE FROM prayer_requests;

-- Clear all notifications
DELETE FROM notifications;

-- Note: User profiles and auth.users are preserved
-- Users can keep their accounts but all content is cleared
