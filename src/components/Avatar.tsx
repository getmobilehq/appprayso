import { getUserInitials, getAvatarColor } from '../utils/user';

interface AvatarProps {
  avatarUrl?: string | null;
  displayName: string;
  userId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  isSpeaking?: boolean;
  isOnline?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const speakingRingClasses = {
  sm: 'ring-2',
  md: 'ring-2',
  lg: 'ring-3',
  xl: 'ring-4',
};

export function Avatar({
  avatarUrl,
  displayName,
  userId = '',
  size = 'md',
  showStatus = false,
  isSpeaking = false,
  isOnline = false,
  className = '',
}: AvatarProps) {
  const initials = getUserInitials(displayName);
  const gradientColor = getAvatarColor(userId);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          flex items-center justify-center
          font-semibold
          transition-all
          ${isSpeaking ? `${speakingRingClasses[size]} ring-green-500 ring-offset-2 ring-offset-[#0f1419]` : ''}
        `}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div
            className={`
              w-full h-full rounded-full
              flex items-center justify-center
              bg-gradient-to-br ${gradientColor}
              text-white
            `}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Status indicator (online/offline) */}
      {showStatus && (
        <span
          className={`
            absolute bottom-0 right-0
            ${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3'}
            rounded-full
            border-2 border-[#0f1419]
            ${isOnline ? 'bg-green-500' : 'bg-gray-500'}
          `}
        />
      )}
    </div>
  );
}
