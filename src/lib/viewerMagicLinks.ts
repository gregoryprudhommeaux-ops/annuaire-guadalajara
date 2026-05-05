import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Unsubscribe,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';

export type ViewerRecipient = {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
};

export type ViewerMagicLinkDoc = {
  id: string;
  createdAt: Timestamp | null;
  createdByEmail: string;
  expiresAt: Timestamp;
  revokedAt: Timestamp | null;
  recipient: ViewerRecipient;
  resolvesCount: number;
  sessionsCount: number;
  totalDurationSec: number;
  lastResolvedAt: Timestamp | null;
  lastSessionAt: Timestamp | null;
};

export type ViewerMagicLinkSessionDoc = {
  id: string;
  linkId: string;
  startedAt: Timestamp;
  lastSeenAt: Timestamp;
  endedAt: Timestamp | null;
  durationSec: number | null;
  userAgent: string;
};

const LINKS = 'viewer_magic_links';
const SESSIONS = 'viewer_magic_link_sessions';

export async function createViewerMagicLinkCallable(input: {
  days: number;
  recipient: ViewerRecipient;
}): Promise<{ ok: true; linkId: string; token: string; expiresAtMs: number }> {
  const fn = httpsCallable<
    { days: number; recipient: ViewerRecipient },
    { ok: true; linkId: string; token: string; expiresAtMs: number }
  >(functions, 'createViewerMagicLink');
  const res = await fn(input);
  return res.data;
}

export async function revokeViewerMagicLinkCallable(linkId: string): Promise<{ ok: true; linkId: string }> {
  const fn = httpsCallable<{ linkId: string }, { ok: true; linkId: string }>(functions, 'revokeViewerMagicLink');
  const res = await fn({ linkId });
  return res.data;
}

export function subscribeToViewerMagicLinks(
  cb: (rows: ViewerMagicLinkDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, LINKS), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ViewerMagicLinkDoc, 'id'>) })));
    },
    (err) => onError?.(err)
  );
}

export function subscribeToViewerMagicLinkSessions(
  linkId: string,
  cb: (rows: ViewerMagicLinkSessionDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, SESSIONS),
    where('linkId', '==', linkId),
    orderBy('startedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ViewerMagicLinkSessionDoc, 'id'>) })));
    },
    (err) => onError?.(err)
  );
}

export async function storeViewerAccessRequestDraft(input: {
  createdByUid: string;
  recipient: ViewerRecipient;
  expiresAt: Date;
}): Promise<void> {
  // Optional helper if we later decide to store drafts; unused for now.
  await setDoc(doc(db, 'viewer_magic_link_drafts', input.createdByUid), {
    recipient: input.recipient,
    expiresAt: Timestamp.fromDate(input.expiresAt),
    updatedAt: serverTimestamp(),
  });
}

