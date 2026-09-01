import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

export type ProfilePhotoUploadErrorCode = 'invalid_type' | 'too_large' | 'not_authenticated';

export class ProfilePhotoUploadError extends Error {
  code: ProfilePhotoUploadErrorCode;

  constructor(code: ProfilePhotoUploadErrorCode, message: string) {
    super(message);
    this.name = 'ProfilePhotoUploadError';
    this.code = code;
  }
}

/** Upload vers Firebase Storage (`profile_avatars/{uid}/…`) et retourne l’URL publique. */
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const uid = String(userId ?? '').trim();
  if (!uid) {
    throw new ProfilePhotoUploadError('not_authenticated', 'Missing user id');
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new ProfilePhotoUploadError('invalid_type', 'Unsupported image type');
  }
  if (file.size > MAX_BYTES) {
    throw new ProfilePhotoUploadError('too_large', 'Image too large');
  }

  const ext = extensionForMime(file.type);
  const objectPath = `profile_avatars/${uid}/avatar-${Date.now()}.${ext}`;
  const storageRef = ref(storage, objectPath);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=31536000',
  });
  return getDownloadURL(storageRef);
}
