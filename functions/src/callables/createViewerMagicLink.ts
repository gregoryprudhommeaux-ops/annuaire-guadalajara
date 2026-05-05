import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Timestamp } from 'firebase-admin/firestore';
import { isCallerAdmin } from '../lib/admin';
import {
  VIEWER_LINKS,
  expiresAtFromNow,
  getDb,
  hashToken,
  randomId,
  randomToken,
  type ViewerRecipient,
} from '../lib/viewerMagicLinks';

function normalizeRecipient(input: any): ViewerRecipient {
  const firstName = String(input?.firstName ?? '').trim();
  const lastName = String(input?.lastName ?? '').trim();
  const email = String(input?.email ?? '').trim().toLowerCase();
  const whatsapp = String(input?.whatsapp ?? '').trim();
  if (!firstName || !lastName || !email) {
    throw new Error('Champs requis: firstName, lastName, email.');
  }
  return { firstName, lastName, email, whatsapp };
}

export const createViewerMagicLink = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }
    const ok = await isCallerAdmin(request.auth.uid, request.auth.token.email ?? null);
    if (!ok) {
      throw new HttpsError('permission-denied', 'Réservé aux admins.');
    }

    const days = Number(request.data?.days ?? 3);
    const recipient = normalizeRecipient(request.data?.recipient);
    const token = randomToken(32);
    const tokenHash = hashToken(token);
    const linkId = randomId(16);
    const createdAt = Timestamp.now();
    const expiresAt = expiresAtFromNow(Number.isFinite(days) ? days : 3);

    const db = getDb();
    await db.collection(VIEWER_LINKS).doc(linkId).set({
      tokenHash,
      createdAt,
      createdByUid: request.auth.uid,
      createdByEmail: String(request.auth.token.email ?? '').trim().toLowerCase(),
      expiresAt,
      revokedAt: null,
      revokedByUid: null,
      revokedByEmail: null,
      recipient,
      resolvesCount: 0,
      sessionsCount: 0,
      totalDurationSec: 0,
      lastResolvedAt: null,
      lastSessionAt: null,
    });

    return {
      ok: true,
      linkId,
      token,
      expiresAtMs: expiresAt.toMillis(),
    };
  }
);

