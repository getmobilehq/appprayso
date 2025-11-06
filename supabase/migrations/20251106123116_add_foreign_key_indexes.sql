/*
  # Add Foreign Key Indexes

  1. Performance Improvements
    - Add indexes on all foreign key columns
    - Improve JOIN performance and referential integrity checks
    - Optimize query execution plans

  2. Indexes Being Added
    - circle_join_requests: user_id
    - prayer_request_amens: user_id
    - prayer_request_responses: user_id
    - prayer_requests: user_id, circle_id
    - prayer_rooms: host_id, circle_id
    - room_invites: invitee_id, inviter_id
    - room_messages: user_id
    - room_speakers: user_id
    - security_audit_log: user_id, target_user_id

  Note: These indexes are essential for foreign key performance
*/

-- Add index for circle_join_requests.user_id
CREATE INDEX IF NOT EXISTS idx_circle_join_requests_user_id 
ON circle_join_requests(user_id);

-- Add index for prayer_request_amens.user_id
CREATE INDEX IF NOT EXISTS idx_prayer_request_amens_user_id 
ON prayer_request_amens(user_id);

-- Add index for prayer_request_responses.user_id
CREATE INDEX IF NOT EXISTS idx_prayer_request_responses_user_id 
ON prayer_request_responses(user_id);

-- Add index for prayer_requests.user_id
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id 
ON prayer_requests(user_id);

-- Add index for prayer_requests.circle_id
CREATE INDEX IF NOT EXISTS idx_prayer_requests_circle_id 
ON prayer_requests(circle_id);

-- Add index for prayer_rooms.host_id
CREATE INDEX IF NOT EXISTS idx_prayer_rooms_host_id 
ON prayer_rooms(host_id);

-- Add index for prayer_rooms.circle_id
CREATE INDEX IF NOT EXISTS idx_prayer_rooms_circle_id 
ON prayer_rooms(circle_id);

-- Add index for room_invites.invitee_id
CREATE INDEX IF NOT EXISTS idx_room_invites_invitee_id 
ON room_invites(invitee_id);

-- Add index for room_invites.inviter_id
CREATE INDEX IF NOT EXISTS idx_room_invites_inviter_id 
ON room_invites(inviter_id);

-- Add index for room_messages.user_id
CREATE INDEX IF NOT EXISTS idx_room_messages_user_id 
ON room_messages(user_id);

-- Add index for room_speakers.user_id
CREATE INDEX IF NOT EXISTS idx_room_speakers_user_id 
ON room_speakers(user_id);

-- Add index for security_audit_log.user_id
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id 
ON security_audit_log(user_id);

-- Add index for security_audit_log.target_user_id
CREATE INDEX IF NOT EXISTS idx_security_audit_log_target_user_id 
ON security_audit_log(target_user_id);