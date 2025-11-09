-- Enable real-time for room_messages table
-- This allows the chat to update in real-time across all connected clients

ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
