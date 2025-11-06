/**
 * Date and time utility functions
 */

/**
 * Get relative time string (e.g., "2m ago", "3h ago", "5d ago")
 */
export function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return then.toLocaleDateString();
}

/**
 * Format scheduled time as relative duration (e.g., "in 2h 30m", "in 3d 5h")
 */
export function formatScheduledTime(date: Date | string): string {
  const now = new Date();
  const scheduledDate = typeof date === 'string' ? new Date(date) : date;
  const diff = scheduledDate.getTime() - now.getTime();

  if (diff <= 0) return 'Starting soon';

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `in ${days}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `in ${minutes}m`;

  return 'Starting soon';
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return checkDate.getTime() < Date.now();
}

/**
 * Check if a date is within the next N hours
 */
export function isWithinHours(date: Date | string, hours: number): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const diff = checkDate.getTime() - Date.now();
  return diff > 0 && diff <= hours * 60 * 60 * 1000;
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
