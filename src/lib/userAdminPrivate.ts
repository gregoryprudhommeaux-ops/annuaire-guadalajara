import {
  doc,
  getDoc,
  setDoc,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { UserProfile } from '../types';
import { GENDER_STAT_VALUES, type GenderStat } from '../types';

/** Collection Firestore : champs visibles uniquement par le membre et les administrateurs. */
export const USER_ADMIN_PRIVATE_COLLECTION = 'user_admin_private';

export type UserAdminPrivateDoc = {
  uid?: string;
  updatedAt?: unknown;
  genderStat?: GenderStat;
  nationality?: string;
  acceptsDelegationVisits?: boolean;
};

/** Anciennes fiches : ces clés pouvaient être sur `users/{uid}` avant la séparation. */
export function legacyAdminFromUserDoc(u: UserProfile | null | undefined): UserAdminPrivateDoc {
  if (!u) return {};
  const raw = u as unknown as Record<string, unknown>;
  const out: UserAdminPrivateDoc = {};
  const g = raw.genderStat;
  if (typeof g === 'string' && (GENDER_STAT_VALUES as readonly string[]).includes(g)) {
    out.genderStat = g as GenderStat;
  }
  const n = raw.nationality;
  if (typeof n === 'string' && n.length >= 2 && n.length <= 3) {
    out.nationality = n.toUpperCase();
  }
  if (typeof raw.acceptsDelegationVisits === 'boolean') {
    out.acceptsDelegationVisits = raw.acceptsDelegationVisits;
  }
  return out;
}

export async function loadUserAdminPrivate(
  uid: string,
  legacyUser: UserProfile | null
): Promise<UserAdminPrivateDoc> {
  const snap = await getDoc(doc(db, USER_ADMIN_PRIVATE_COLLECTION, uid));
  if (snap.exists()) {
    return snap.data() as UserAdminPrivateDoc;
  }
  return legacyAdminFromUserDoc(legacyUser);
}

export async function saveUserAdminPrivate(
  uid: string,
  fields: {
    genderStat: GenderStat | undefined;
    nationality: string | undefined;
    acceptsDelegationVisits: boolean;
  }
): Promise<void> {
  const ref = doc(db, USER_ADMIN_PRIVATE_COLLECTION, uid);
  const payload: Record<string, unknown> = {
    uid,
    updatedAt: serverTimestamp(),
    acceptsDelegationVisits: fields.acceptsDelegationVisits,
  };
  if (fields.genderStat !== undefined) {
    payload.genderStat = fields.genderStat;
  } else {
    payload.genderStat = deleteField();
  }
  if (fields.nationality !== undefined) {
    payload.nationality = fields.nationality;
  } else {
    payload.nationality = deleteField();
  }
  await setDoc(ref, payload, { merge: true });
}
