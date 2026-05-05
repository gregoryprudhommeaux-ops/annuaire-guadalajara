import { getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import crypto from 'node:crypto';
import { FIRESTORE_DATABASE_ID } from '../constants';

export const viewerMagicLinkPepper = defineString('VIEWER_MAGIC_LINK_PEPPER');

export type ViewerRecipient = {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
};

export type ViewerMagicLinkDoc = {
  tokenHash: string;
  createdAt: Timestamp;
  createdByUid: string;
  createdByEmail: string;
  expiresAt: Timestamp;
  revokedAt: Timestamp | null;
  revokedByUid: string | null;
  revokedByEmail: string | null;
  recipient: ViewerRecipient;
  resolvesCount: number;
  sessionsCount: number;
  totalDurationSec: number;
  lastResolvedAt: Timestamp | null;
  lastSessionAt: Timestamp | null;
};

export type ViewerMagicLinkSessionDoc = {
  linkId: string;
  tokenHash: string;
  startedAt: Timestamp;
  lastSeenAt: Timestamp;
  endedAt: Timestamp | null;
  durationSec: number | null;
  userAgent: string;
};

export function randomToken(bytes = 32): string {
  const buf = crypto.randomBytes(bytes);
  // base64url
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export function hashToken(token: string): string {
  const pepper = viewerMagicLinkPepper.value();
  if (!pepper) {
    throw new Error('Missing VIEWER_MAGIC_LINK_PEPPER param');
  }
  return crypto
    .createHash('sha256')
    .update(`${pepper}::${token}`, 'utf8')
    .digest('hex');
}

export function randomId(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function getDb() {
  const app = getApps()[0];
  if (!app) throw new Error('Admin app not initialized');
  return getFirestore(app, FIRESTORE_DATABASE_ID);
}

export const VIEWER_LINKS = 'viewer_magic_links';
export const VIEWER_SESSIONS = 'viewer_magic_link_sessions';

export function nowTs(): Timestamp {
  return Timestamp.now();
}

export function expiresAtFromNow(days: number): Timestamp {
  const ms = Date.now() + Math.max(1, Math.round(days)) * 24 * 60 * 60 * 1000;
  return Timestamp.fromMillis(ms);
}

export async function revokeLink(linkId: string, by: { uid: string; email: string }): Promise<void> {
  const db = getDb();
  const ref = db.collection(VIEWER_LINKS).doc(linkId);
  await ref.set(
    {
      revokedAt: nowTs(),
      revokedByUid: by.uid,
      revokedByEmail: by.email,
    },
    { merge: true }
  );
}

export async function touchResolve(linkId: string): Promise<void> {
  const db = getDb();
  await db.collection(VIEWER_LINKS).doc(linkId).set(
    {
      resolvesCount: FieldValue.increment(1),
      lastResolvedAt: nowTs(),
    },
    { merge: true }
  );
}

