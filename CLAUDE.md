# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Prayer.so is a live audio prayer platform connecting believers worldwide through real-time prayer rooms. Built with React + TypeScript + Vite, using Supabase for backend/auth and LiveKit for real-time audio streaming.

## Commands

### Development
```bash
npm run dev          # Start dev server on http://localhost:5173
npm run build        # Build for production (runs tsc + vite build)
npm run preview      # Preview production build locally
```

Note: `package.json` does not include lint or test commands. If adding these, follow standard patterns for React+TypeScript projects.

### Supabase Setup
- Database migrations located in `supabase/migrations/` - run in order via Supabase dashboard
- Edge function in `supabase/functions/generate-livekit-token/` - deploy to Supabase project separately

## Architecture

### Authentication & State
- **AuthContext** (`src/contexts/AuthContext.tsx`) wraps entire app, provides global auth state
- All routes except `/login` require authentication (see `App.tsx`)
- Supabase client initialized in `src/lib/supabase.ts` using env variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

### LiveKit Integration
- **useLiveKit hook** (`src/hooks/useLiveKit.ts`) manages WebRTC connections
- Tokens generated via Supabase Edge Function which calls LiveKit API
- Flow: Frontend → Edge Function (`generate-livekit-token`) → LiveKit API → Token → Room Connection
- Hook provides: `connect()`, `disconnect()`, `toggleMute()`, participants list, audio tracks

### Data Model (see `src/types/index.ts`)
Key entities:
- **PrayerRoom**: Live audio rooms (can be public or circle-private, supports scheduling)
- **Circle**: Private prayer groups with member management
- **PrayerRequest**: Community prayer wall posts with amens/responses
- **RoomSpeaker**: Role-based permissions (host/speaker/listener) in rooms

### Routing & Code Splitting
- React Router with lazy-loaded route components (`App.tsx`)
- Protected routes redirect to `/login` if unauthenticated
- Suspense boundaries show loading spinners during lazy loads

### Build Optimization
- Manual chunk splitting configured in `vite.config.ts`:
  - `react-vendor`: React core libraries
  - `supabase`: Supabase client
  - `livekit`: LiveKit client
  - `icons`: Lucide icons
- Reduces initial bundle size, improves caching

## Environment Variables

Required:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LIVEKIT_URL=your_livekit_websocket_url
```

LiveKit Edge Function also requires (set in Supabase dashboard):
```env
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

## Database Considerations

- Row Level Security (RLS) enabled on all tables
- Multiple migrations optimize RLS policies to avoid recursive auth checks
- Foreign key indexes added for performance (`20251106123116_add_foreign_key_indexes.sql`)
- Notification system available via `notifications` table

## Key Implementation Patterns

1. **Audio Room Connection**: Use `useLiveKit` hook with room name, participant details. Token fetched automatically from edge function.

2. **Supabase Queries**: Import `supabase` client from `src/lib/supabase.ts`, use standard SDK methods. Check RLS policies if queries fail unexpectedly.

3. **Adding Routes**: Update `App.tsx` with lazy-loaded component, add auth protection wrapper if needed.

4. **Component Structure**: Pages in `src/pages/`, reusable components in `src/components/`, organize by feature not type.
