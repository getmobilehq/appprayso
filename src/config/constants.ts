/**
 * Application-wide constants and configuration values
 */

export const ROOM_CATEGORIES = [
  'Morning Prayer',
  'Evening Prayer',
  'Bible Study',
  'Intercession',
  'Worship',
  'Thanksgiving',
  'Youth Prayer',
  'Family Prayer',
  'Other',
] as const;

export const PRAYER_REQUEST_CATEGORIES = [
  'Healing',
  'Family',
  'Financial',
  'Career',
  'Relationships',
  'Spiritual Growth',
  'Guidance',
  'Thanksgiving',
  'Intercession',
  'Other',
] as const;

export const PRAYER_WALL_CATEGORIES = [
  'All',
  'General Prayer',
  'Healing',
  'Thanksgiving',
  'Intercession',
  'Worship',
  'Family',
  'Guidance',
  'Strength',
] as const;

export const LIMITS = {
  // Pagination limits
  NOTIFICATIONS_PER_PAGE: 20,
  MESSAGES_PER_PAGE: 50,

  // Character limits
  PRAYER_REQUEST_TITLE_MAX: 100,
  PRAYER_REQUEST_CONTENT_MAX: 2000,

  // Room limits
  MIN_PARTICIPANTS: 2,
  MAX_PARTICIPANTS: 1000,
  DEFAULT_PARTICIPANTS: 50,

  // Audio settings
  AUDIO_EQUALIZER_BARS: 7,
  AUDIO_FFT_SIZE: 256,
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PRAYER_WALL: '/prayer-wall',
  CIRCLES: '/circles',
  PROFILE: '/profile',
  CREATE_ROOM: '/create-room',
  CREATE_PRAYER_REQUEST: '/create-prayer-request',
  ROOM_DETAIL: (id: string) => `/room/${id}`,
  PRAYER_REQUEST_DETAIL: (id: string) => `/prayer-request/${id}`,
} as const;

export const COLORS = {
  // Surface colors
  SURFACE_PRIMARY: '#1e2732',
  SURFACE_SECONDARY: '#0f1419',
  SURFACE_TERTIARY: '#24303f',

  // Background
  BACKGROUND: '#15202b',
} as const;

export type RoomCategory = typeof ROOM_CATEGORIES[number];
export type PrayerRequestCategory = typeof PRAYER_REQUEST_CATEGORIES[number];
export type PrayerWallCategory = typeof PRAYER_WALL_CATEGORIES[number];
