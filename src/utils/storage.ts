import { supabase } from '../lib/supabase';

/**
 * Storage utilities for managing user uploads
 */

const AVATARS_BUCKET = 'avatars';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

/**
 * Upload user avatar to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 2MB');
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('File must be JPEG, PNG, or WebP');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload file
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      path: fileName,
    };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Delete user avatar from Supabase Storage
 */
export async function deleteAvatar(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return false;
  }
}

/**
 * Update user profile avatar URL in database
 */
export async function updateProfileAvatar(
  userId: string,
  avatarUrl: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ photo_url: avatarUrl })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating profile avatar:', error);
    return false;
  }
}

/**
 * Compress image before upload
 */
export async function compressImage(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Image load failed'));
    };

    reader.onerror = () => reject(new Error('FileReader failed'));
  });
}

/**
 * Get avatar URL with fallback to initials
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined
): string | null {
  if (avatarUrl) {
    return avatarUrl;
  }
  return null; // Will use initials fallback in Avatar component
}
