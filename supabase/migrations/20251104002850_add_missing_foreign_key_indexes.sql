/*
  # Add Missing Foreign Key Indexes for Performance

  1. Performance Improvements
    - Add indexes on foreign key columns that are missing covering indexes
    - Improves JOIN performance and foreign key constraint checking
    - Prevents table scans on referenced columns

  2. New Indexes
    - `prayer_request_responses.user_id`
    - `room_invites.inviter_id`
    - `room_messages.user_id`
    - `security_audit_log.user_id`
    - `security_audit_log.target_user_id`
*/

-- Add index on prayer_request_responses.user_id
CREATE INDEX IF NOT EXISTS idx_prayer_request_responses_user_id 
ON prayer_request_responses(user_id);

-- Add index on room_invites.inviter_id
CREATE INDEX IF NOT EXISTS idx_room_invites_inviter_id 
ON room_invites(inviter_id);

-- Add index on room_messages.user_id
CREATE INDEX IF NOT EXISTS idx_room_messages_user_id 
ON room_messages(user_id);

-- Add index on security_audit_log.user_id
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id 
ON security_audit_log(user_id);

-- Add index on security_audit_log.target_user_id
CREATE INDEX IF NOT EXISTS idx_security_audit_log_target_user_id 
ON security_audit_log(target_user_id);
