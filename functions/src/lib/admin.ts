import { getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { FIRESTORE_DATABASE_ID } from '../constants';

const ADMIN_EMAIL = 'chinois2001@gmail.com';
const HARDCODED_ADMIN_UID = 'HiSztwqyDXUZ5RalOyqUP3BJd6Y2';

/**
 * Mêmes critères que `firestore.rules:isAdmin()` :
 * UID hardcodé, allowlist Firestore, email du token, ou rôle admin sur users/{uid}.
 */
export async function isCallerAdmin(
  uid: string | undefined,
  email: string | undefined | null
): Promise<boolean> {
  if (!uid) return false;
  if (uid === HARDCODED_ADMIN_UID) return true;
  if (email && email.trim().toLowerCase() === ADMIN_EMAIL) return true;

  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);

  const allowlist = await db.doc(`admin_allowlist/${uid}`).get();
  if (allowlist.exists) return true;

  const userDoc = await db.doc(`users/${uid}`).get();
  if (userDoc.exists && userDoc.data()?.role === 'admin') return true;

  return false;
}
