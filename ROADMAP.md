# Prayer.so Feature Roadmap

## 🎯 Vision
Build a comprehensive live audio prayer platform with real-time collaboration, recurring sessions, and rich participant interactions.

---

## 📋 Phase 1: Core Experience Improvements (1-2 weeks)
**Priority: HIGH** | **Complexity: LOW-MEDIUM**

### 1.1 Real-time Chat Enhancements ⭐
**Your Request:** Chat with notification sounds when messages arrive

**Implementation:**
- Already using Supabase Realtime ✅
- Add sound notification on new message
- Add unread message badge
- Add typing indicators
- Auto-scroll to latest message

**Technical Details:**
```typescript
// Add to RoomDetailPage
const [unreadCount, setUnreadCount] = useState(0);
const notificationSound = new Audio('/notification.mp3');

// In Supabase subscription
if (newMsg.user_id !== user?.id) {
  notificationSound.play();
  setUnreadCount(prev => prev + 1);
}
```

**Database Changes:** None required
**Estimated Time:** 4-6 hours

---

### 1.2 Participant List & Presence ⭐⭐
**Your Request:** Know who is in the room

**Implementation:**
- Show live participant list with avatars
- Show speaking indicator (green ring around avatar)
- Show muted/unmuted status
- Show join/leave notifications

**Technical Details:**
- LiveKit already provides `participants` array
- Add UI component for participant grid
- Use LiveKit events: `ParticipantConnected`, `ParticipantDisconnected`
- Track audio levels to show who's speaking

**Database Changes:** None required (LiveKit handles this)
**Estimated Time:** 6-8 hours

---

### 1.3 Profile Pictures ⭐⭐
**Your Request:** Every user identity visible with profile picture

**Implementation:**
- Add avatar upload to profile page
- Store images in Supabase Storage
- Display avatars in participant list, chat, and rooms
- Generate initials-based fallback avatars (already have utility)

**Technical Details:**
```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
```

**Supabase Storage:**
- Create `avatars` bucket
- Set up RLS policies for avatar access
- Max size: 2MB, formats: jpg, png, webp

**Database Changes:** Yes - `profiles.avatar_url`
**Estimated Time:** 8-10 hours

---

### 1.4 Improved Chat Layout ⭐⭐⭐
**Your Request:** Side chat panel with participant profiles (like X Spaces)

**Implementation:**
- Move chat to sidebar (30% width)
- Main area shows participant grid (70% width)
- Responsive: mobile switches to tabs (Participants | Chat)
- Minimize/expand chat panel

**Technical Details:**
- Redesign RoomDetailPage layout
- Add ResizablePanel component
- Save panel size preference to localStorage
- Mobile: Bottom sheet for chat

**Database Changes:** None
**Estimated Time:** 10-12 hours

---

## 📋 Phase 2: Host Controls & Moderation (2-3 weeks)
**Priority: HIGH** | **Complexity: MEDIUM**

### 2.1 Host Can Mute Participants ⭐⭐
**Your Request:** Host ability to mute other users

**Implementation:**
- Add "Mute User" button in participant list (host only)
- Send mute command via LiveKit
- Show notification to muted user
- Muted user can unmute themselves (or prevent if needed)

**Technical Details:**
```typescript
// Use LiveKit Room API
await room.localParticipant.publishData(
  JSON.stringify({ type: 'MUTE_REQUEST', targetId: participantId }),
  { reliable: true }
);
```

**Database Changes:**
```sql
-- Track moderation actions
CREATE TABLE room_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES prayer_rooms(id),
  moderator_id UUID REFERENCES profiles(id),
  target_user_id UUID REFERENCES profiles(id),
  action TEXT, -- 'mute', 'unmute', 'remove'
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Estimated Time:** 6-8 hours

---

### 2.2 Host Transfer ⭐⭐
**Your Request:** Host can make another user the host

**Implementation:**
- Add "Make Host" button in participant list
- Update room.host_id in database
- Transfer host UI controls
- Send notification to new host
- Show host badge on avatar

**Technical Details:**
```sql
-- Add to prayer_rooms
ALTER TABLE prayer_rooms ADD COLUMN co_hosts UUID[] DEFAULT '{}';

-- Function to transfer host
UPDATE prayer_rooms
SET host_id = $new_host_id,
    co_hosts = array_append(co_hosts, $old_host_id)
WHERE id = $room_id;
```

**Database Changes:** Yes - co-host support
**Estimated Time:** 8-10 hours

---

### 2.3 Auto Host Assignment (Circles) ⭐⭐⭐
**Your Request:** Auto-assign host when original leaves (circles only)

**Implementation:**
- Detect when host disconnects
- If room belongs to circle, pick next co-host or senior member
- Priority order: co-hosts > circle admin > longest member
- Broadcast host change to all participants

**Technical Details:**
```typescript
// On host disconnect
room.on(RoomEvent.ParticipantDisconnected, async (participant) => {
  if (participant.identity === currentHostId && room.circleId) {
    const newHost = await selectNextHost(room.circleId);
    await transferHost(newHost);
  }
});
```

**Database Changes:** None (uses existing circle_members)
**Estimated Time:** 10-12 hours

---

## 📋 Phase 3: Recurring Meetings & Scheduling (3-4 weeks)
**Priority: MEDIUM-HIGH** | **Complexity: HIGH**

### 3.1 Recurring Meetings ⭐⭐⭐
**Your Request:** Daily/Weekly/Monthly recurring with duration

**Implementation:**
- Add recurrence options to room creation
- Generate series of scheduled instances
- RRULE (RFC 5545) support for complex patterns
- Show "Next occurrence" on room card
- Auto-create next instance when current ends

**Technical Details:**
```sql
-- Add to prayer_rooms
ALTER TABLE prayer_rooms ADD COLUMN recurrence_rule TEXT; -- RRULE format
ALTER TABLE prayer_rooms ADD COLUMN recurrence_end_date TIMESTAMP;
ALTER TABLE prayer_rooms ADD COLUMN parent_series_id UUID REFERENCES prayer_rooms(id);
ALTER TABLE prayer_rooms ADD COLUMN duration_minutes INTEGER DEFAULT 60;

-- Example RRULE
-- Daily: "FREQ=DAILY;INTERVAL=1"
-- Weekly on Mon/Wed/Fri: "FREQ=WEEKLY;BYDAY=MO,WE,FR"
-- Monthly 1st Sunday: "FREQ=MONTHLY;BYDAY=1SU"
```

**Use Library:** `rrule` npm package for recurrence logic

**UI Components:**
- Recurrence picker (Daily/Weekly/Monthly)
- Day of week selector (for weekly)
- Duration slider (15min - 4 hours)
- End date picker

**Background Job:**
- Supabase Edge Function or cron to generate upcoming instances
- Run daily to create instances 7 days ahead

**Database Changes:** Yes - extensive
**Estimated Time:** 20-25 hours

---

### 3.2 Series Management
**Additional Feature Recommendation**

- Edit series: "Edit this occurrence" vs "Edit all future"
- Cancel single occurrence vs entire series
- Show calendar view of upcoming sessions
- iCal export for calendar apps

**Estimated Time:** 15-20 hours

---

## 📋 Phase 4: Circle Live Sessions (3-4 weeks)
**Priority: MEDIUM** | **Complexity: MEDIUM-HIGH**

### 4.1 Circle Live Rooms ⭐⭐⭐
**Your Request:** Circle members can go live together

**Implementation:**
- Add "Go Live" button on circle detail page
- Create room automatically linked to circle
- Only circle members can join
- Inherits circle privacy settings
- Show active circle sessions on circle page

**Technical Details:**
```sql
-- Link rooms to circles (already exists)
-- prayer_rooms.circle_id

-- Add circle-specific features
ALTER TABLE prayer_rooms ADD COLUMN is_circle_room BOOLEAN DEFAULT FALSE;
ALTER TABLE prayer_rooms ADD COLUMN allow_all_members_speak BOOLEAN DEFAULT TRUE;

-- Query active circle rooms
SELECT * FROM prayer_rooms
WHERE circle_id = $circle_id
  AND status = 'live'
  AND is_circle_room = TRUE;
```

**UI Changes:**
- CirclesPage: Show "Live Now" badge if circle has active room
- CircleDetailPage: Add "Start Circle Prayer" button
- Room controls default to co-host mode (all can speak)

**Database Changes:** Minor additions
**Estimated Time:** 12-15 hours

---

## 📋 Phase 5: Advanced Features (4-6 weeks)
**Priority: MEDIUM-LOW** | **Complexity: MEDIUM-HIGH**

### 5.1 Breakout Rooms
**My Recommendation**

- Host can create breakout groups
- Split participants into smaller prayer groups
- Auto-assign or manual selection
- Set timer and bring everyone back

**Estimated Time:** 25-30 hours

---

### 5.2 Recording & Playback
**My Recommendation**

- Record live sessions (with consent)
- Store in Supabase Storage
- Playback with transcription
- Share recordings with circle members

**Technical Details:**
- Use LiveKit Egress API for recording
- Store in S3-compatible storage
- Add consent UI before recording

**Privacy Considerations:**
- Explicit user consent required
- GDPR compliance for EU users
- Auto-delete after 30 days option

**Estimated Time:** 30-35 hours

---

### 5.3 Reactions & Hand Raising
**My Recommendation**

- Raise hand to request to speak
- Quick reactions: 🙏 ❤️ ✨ (like Clubhouse)
- Host can call on raised hands
- Queue management

**Estimated Time:** 8-10 hours

---

### 5.4 Screen Sharing (Future)
**My Recommendation**

- Share Bible verses, prayer guides
- PowerPoint for Bible study
- LiveKit supports screen sharing

**Estimated Time:** 10-12 hours

---

### 5.5 Live Transcription
**My Recommendation**

- Real-time speech-to-text
- Accessibility for hearing impaired
- Search prayer session transcripts
- Use OpenAI Whisper or Deepgram

**Estimated Time:** 20-25 hours

---

## 🗂️ Additional Recommendations

### A. Analytics & Insights
- Track engagement metrics
- Most active prayer times
- Popular prayer topics
- Growth tracking per circle

**Estimated Time:** 15-20 hours

---

### B. Mobile App (React Native)
- Native iOS/Android experience
- Push notifications
- Background audio support
- Better battery optimization

**Estimated Time:** 200+ hours (separate project)

---

### C. Moderation Tools
- Report inappropriate content
- Ban users from circles/rooms
- Auto-moderation with AI
- Moderation dashboard

**Estimated Time:** 25-30 hours

---

### D. Integrations
- Calendar sync (Google Calendar, Outlook)
- Zoom/Google Meet fallback
- Email reminders
- SMS notifications (Twilio)

**Estimated Time:** 20-25 hours per integration

---

### E. Prayer Request Features
- AI-powered prayer suggestions
- Translation for multilingual prayers
- Prayer journal integration
- Export prayers to PDF

**Estimated Time:** 30-40 hours

---

## 🎯 Recommended Implementation Order

### Sprint 1-2 (MVP+)
1. ✅ Profile Pictures (1.3)
2. ✅ Real-time Chat Sounds (1.1)
3. ✅ Participant List (1.2)

### Sprint 3-4 (Host Controls)
4. ✅ Host Can Mute (2.1)
5. ✅ Improved Chat Layout (1.4)
6. ✅ Host Transfer (2.2)

### Sprint 5-6 (Recurring)
7. ✅ Recurring Meetings (3.1)
8. ✅ Series Management (3.2)

### Sprint 7-8 (Circles)
9. ✅ Circle Live Rooms (4.1)
10. ✅ Auto Host Assignment (2.3)

### Sprint 9-10 (Advanced)
11. ✅ Reactions & Hand Raising (5.3)
12. ✅ Recording (if needed) (5.2)

---

## 📊 Database Schema Updates Needed

```sql
-- profiles table
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN bio TEXT;
ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';

-- prayer_rooms table
ALTER TABLE prayer_rooms ADD COLUMN co_hosts UUID[] DEFAULT '{}';
ALTER TABLE prayer_rooms ADD COLUMN recurrence_rule TEXT;
ALTER TABLE prayer_rooms ADD COLUMN recurrence_end_date TIMESTAMP;
ALTER TABLE prayer_rooms ADD COLUMN parent_series_id UUID REFERENCES prayer_rooms(id);
ALTER TABLE prayer_rooms ADD COLUMN duration_minutes INTEGER DEFAULT 60;
ALTER TABLE prayer_rooms ADD COLUMN is_circle_room BOOLEAN DEFAULT FALSE;
ALTER TABLE prayer_rooms ADD COLUMN allow_all_members_speak BOOLEAN DEFAULT TRUE;

-- New tables
CREATE TABLE room_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES prayer_rooms(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES profiles(id),
  target_user_id UUID REFERENCES profiles(id),
  action TEXT CHECK (action IN ('mute', 'unmute', 'remove', 'make_host')),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE room_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES prayer_rooms(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE user_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES prayer_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  reaction_type TEXT, -- 'pray', 'heart', 'sparkle', 'raise_hand'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Technical Stack Additions

**New Dependencies:**
```json
{
  "rrule": "^2.8.1",           // Recurring events
  "react-avatar-editor": "^13.0.2", // Avatar upload/crop
  "react-resizable-panels": "^2.0.0", // Resizable chat panel
  "date-fns": "^3.0.0",        // Date manipulation
  "deepgram-sdk": "^3.0.0"     // Live transcription (optional)
}
```

**Supabase Storage Buckets:**
- `avatars` - User profile pictures
- `recordings` - Session recordings
- `attachments` - Shared files in chat

---

## 💰 Cost Considerations

**LiveKit:**
- Current: ~$0.015 per participant-minute
- With 1000 users, 30min avg: ~$450/month

**Supabase:**
- Free tier: 500MB database, 1GB storage
- Pro: $25/month (8GB database, 100GB storage)

**Storage (Recordings):**
- 1 hour recording ≈ 50MB
- 100 hours/month = 5GB ≈ $0.50/month (S3)

**Deepgram (Transcription):**
- $0.0125 per minute of audio
- 1000 hours/month = $750/month

---

## ✅ Success Metrics

**Phase 1:**
- [ ] 90% of users upload profile pictures
- [ ] 50% reduction in "who's here?" chat messages
- [ ] Average session time increases 20%

**Phase 2:**
- [ ] Moderation actions < 1% of sessions
- [ ] Host transfers happen smoothly 95% of time

**Phase 3:**
- [ ] 40% of rooms use recurring feature
- [ ] 70% attendance rate for recurring sessions

**Phase 4:**
- [ ] 50% of circles use live feature monthly
- [ ] Average circle session: 45 minutes

---

## 🚀 Next Steps

**Immediate (This Week):**
1. Prioritize features with stakeholders
2. Create detailed specs for Phase 1
3. Set up Supabase Storage for avatars
4. Design participant list UI mockups

**Next Sprint:**
1. Implement Phase 1 features
2. User testing with small group
3. Iterate based on feedback

---

**Questions to Consider:**
1. Which features are "must-have" vs "nice-to-have"?
2. What's your target timeline for MVP launch?
3. Budget for LiveKit/Supabase as you scale?
4. Team size (solo dev or hiring)?
5. Target audience size (100s, 1000s, 10000s)?
