import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar } from './Avatar';
import { uploadAvatar, compressImage, updateProfileAvatar } from '../utils/storage';

interface AvatarUploadProps {
  userId: string;
  displayName: string;
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (avatarUrl: string) => void;
  onUploadError?: (error: Error) => void;
}

export function AvatarUpload({
  userId,
  displayName,
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Compress image
      const compressedFile = await compressImage(file);

      // Upload to Supabase Storage
      const result = await uploadAvatar(userId, compressedFile);

      if (!result) {
        throw new Error('Failed to upload avatar');
      }

      // Update profile in database
      const success = await updateProfileAvatar(userId, result.url);

      if (!success) {
        throw new Error('Failed to update profile');
      }

      // Update preview with final URL
      setPreviewUrl(result.url);

      // Notify parent component
      onUploadSuccess?.(result.url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      // Revert preview on error
      setPreviewUrl(currentAvatarUrl || null);
      onUploadError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      <Avatar
        avatarUrl={previewUrl}
        displayName={displayName}
        userId={userId}
        size="xl"
      />

      <button
        onClick={handleClick}
        disabled={uploading}
        className={`
          absolute bottom-0 right-0
          w-8 h-8
          rounded-full
          bg-blue-500
          flex items-center justify-center
          text-white
          border-2 border-[#0f1419]
          transition-all
          hover:bg-blue-600
          disabled:opacity-50
          disabled:cursor-not-allowed
        `}
        title="Upload profile picture"
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Camera size={16} />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
