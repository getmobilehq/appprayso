/*
  # Remove Unused Database Indexes

  1. Security Improvements
    - Remove unused indexes that create unnecessary overhead
    - Keep only indexes that are actively used by queries
    - Improve database performance and reduce storage

  2. Indexes Being Removed
    - prayer_rooms: host_id, created_at, circle_id, scheduled_start
    - prayer_request_amens: user_id
    - prayer_request_responses: created_at, user_id
    - room_messages: created_at, user_id
    - room_invites: room_id, invitee_id, inviter_id
    - room_speakers: room_id, user_id
    - prayer_requests: user_id, visibility, circle_id
    - security_audit_log: user_id, target_user_id
    - circle_join_requests: user_id, status
    - notifications: is_read, created_at, user_unread

  Note: Indexes will be kept on foreign key columns for referential integrity checks
*/

-- Drop unused indexes on prayer_rooms
DROP INDEX IF EXISTS idx_prayer_rooms_host_id;
DROP INDEX IF EXISTS idx_prayer_rooms_created_at;
DROP INDEX IF EXISTS idx_prayer_rooms_circle_id;
DROP INDEX IF EXISTS idx_prayer_rooms_scheduled_start;

-- Drop unused indexes on prayer_request_amens
DROP INDEX IF EXISTS idx_prayer_request_amens_user_id;

-- Drop unused indexes on prayer_request_responses
DROP INDEX IF EXISTS idx_prayer_request_responses_created_at;
DROP INDEX IF EXISTS idx_prayer_request_responses_user_id;

-- Drop unused indexes on room_messages
DROP INDEX IF EXISTS idx_room_messages_created_at;
DROP INDEX IF EXISTS idx_room_messages_user_id;

-- Drop unused indexes on room_invites
DROP INDEX IF EXISTS idx_room_invites_room_id;
DROP INDEX IF EXISTS idx_room_invites_invitee_id;
DROP INDEX IF EXISTS idx_room_invites_inviter_id;

-- Drop unused indexes on room_speakers
DROP INDEX IF EXISTS idx_room_speakers_room_id;
DROP INDEX IF EXISTS idx_room_speakers_user_id;

-- Drop unused indexes on prayer_requests
DROP INDEX IF EXISTS idx_prayer_requests_user_id;
DROP INDEX IF EXISTS idx_prayer_requests_visibility;
DROP INDEX IF EXISTS idx_prayer_requests_circle_id;

-- Drop unused indexes on security_audit_log
DROP INDEX IF EXISTS idx_security_audit_log_user_id;
DROP INDEX IF EXISTS idx_security_audit_log_target_user_id;

-- Drop unused indexes on circle_join_requests
DROP INDEX IF EXISTS idx_circle_join_requests_user_id;
DROP INDEX IF EXISTS idx_circle_join_requests_status;

-- Drop unused indexes on notifications
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_user_unread;