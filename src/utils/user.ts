import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Utility functions for user-related operations
 */

interface Profile {
  display_name?: string | null;
  email?: string | null;
}

/**
 * Get a consistent display name for a user across the application
 * Priority: profile.display_name > user.user_metadata.full_name > email username > 'Anonymous'
 */
export function getDisplayName(user: SupabaseUser | null, profile?: Profile | null): string {
  if (!user) return 'Anonymous';

  // Try profile display name first
  if (profile?.display_name) {
    return profile.display_name;
  }

  // Try user metadata full name
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }

  // Fall back to email username
  if (user.email) {
    const emailUsername = user.email.split('@')[0];
    return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
  }

  return 'Anonymous';
}

/**
 * Get user initials for avatar display
 */
export function getUserInitials(displayName: string): string {
  if (!displayName || displayName === 'Anonymous') {
    return 'A';
  }

  const parts = displayName.trim().split(' ');

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format user's join date
 */
export function formatJoinDate(user: SupabaseUser | null): string {
  if (!user?.created_at) {
    return new Date().toLocaleDateString();
  }

  return new Date(user.created_at).toLocaleDateString();
}

/**
 * Get avatar color based on user ID (consistent color per user)
 */
export function getAvatarColor(userId: string): string {
  const colors = [
    'from-blue-500 to-purple-600',
    'from-red-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-yellow-500 to-orange-600',
    'from-indigo-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-cyan-500 to-blue-600',
    'from-purple-500 to-indigo-600',
  ];

  // Use userId to consistently pick a color
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
