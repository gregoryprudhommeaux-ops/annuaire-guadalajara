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

/**
 * Évite les écritures répétées sur `auth_leads` quand `onAuthStateChanged` se déclenche
 * plusieurs fois de suite (rafraîchissement de jeton, rechargement, onglets).
 * Une extension ou une Cloud Function liée aux écritures ne doit pas notifier l’admin en rafale.
 */
const MIN_MS_BETWEEN_REDUNDANT_LEAD_TOUCH = 2 * 60 * 1000;

function authLeadFingerprint(
  email: string,
  displayName: string,
  photoURL: string,
  primaryProvider: string,
  emailVerified: boolean
): string {
  return JSON.stringify({ email, displayName, photoURL, primaryProvider, emailVerified });
}

/** Enregistre ou met à jour la piste (merge), sans réécrire si rien n’a changé récemment. */
export async function upsertAuthLeadFromFirebaseUser(db: Firestore, u: User): Promise<void> {
  const ref = doc(db, AUTH_LEADS_COLLECTION, u.uid);
  const snap = await getDoc(ref);
  const primaryProvider = u.providerData[0]?.providerId ?? '';
  const email = u.email ?? '';
  const displayName = u.displayName ?? '';
  const photoURL = u.photoURL ?? '';
  const emailVerified = u.emailVerified === true;
  const fp = authLeadFingerprint(email, displayName, photoURL, primaryProvider, emailVerified);

  if (snap.exists()) {
    const prev = snap.data() as Partial<AuthLeadDoc>;
    const prevFp = authLeadFingerprint(
      String(prev.email ?? ''),
      String(prev.displayName ?? ''),
      String(prev.photoURL ?? ''),
      String(prev.primaryProvider ?? ''),
      prev.emailVerified === true
    );
    const lastAt = prev.lastConnectedAt;
    let lastMs = 0;
    if (lastAt && typeof (lastAt as Timestamp).toMillis === 'function') {
      lastMs = (lastAt as Timestamp).toMillis();
    }
    const elapsed = Math.max(0, Date.now() - lastMs);
    if (fp === prevFp && elapsed < MIN_MS_BETWEEN_REDUNDANT_LEAD_TOUCH) {
      return;
    }
  }

  const payload: Record<string, unknown> = {
    uid: u.uid,
    email,
    displayName,
    photoURL,
    primaryProvider,
    emailVerified,
    lastConnectedAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    payload.firstConnectedAt = serverTimestamp();
  }

  await setDoc(ref, payload, { merge: true });
}
