/**
 * Piste des connexions OAuth (Google / Microsoft / Apple) pour relance admin,
 * indépendamment de la création d’une fiche `users/{uid}` dans l’annuaire.
 */
import { doc, getDoc, setDoc, serverTimestamp, type Firestore, type Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export const AUTH_LEADS_COLLECTION = 'auth_leads';

export type AuthLeadDoc = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  /** ex. google.com, microsoft.com, apple.com */
  primaryProvider: string;
  emailVerified: boolean;
  firstConnectedAt: Timestamp;
  lastConnectedAt: Timestamp;
};

/** Enregistre ou met à jour la piste à chaque session (merge). */
export async function upsertAuthLeadFromFirebaseUser(db: Firestore, u: User): Promise<void> {
  const ref = doc(db, AUTH_LEADS_COLLECTION, u.uid);
  const snap = await getDoc(ref);
  const primaryProvider = u.providerData[0]?.providerId ?? '';

  const payload: Record<string, unknown> = {
    uid: u.uid,
    email: u.email ?? '',
    displayName: u.displayName ?? '',
    photoURL: u.photoURL ?? '',
    primaryProvider,
    emailVerified: u.emailVerified === true,
    lastConnectedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    payload.firstConnectedAt = serverTimestamp();
  }

  await setDoc(ref, payload, { merge: true });
}
