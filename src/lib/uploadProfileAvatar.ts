import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/**
 * Envoie la photo dans Storage (`profile_avatars/{uid}`) et retourne l’URL publique.
 * Nécessite des règles Storage correspondantes (voir `storage.rules` à la racine du projet).
 */
export async function uploadProfileAvatar(uid: string, file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error('INVALID_TYPE');
  if (file.size > MAX_BYTES) throw new Error('TOO_LARGE');
  const storageRef = ref(storage, `profile_avatars/${uid}`);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=604800',
  });
  return getDownloadURL(storageRef);
}
