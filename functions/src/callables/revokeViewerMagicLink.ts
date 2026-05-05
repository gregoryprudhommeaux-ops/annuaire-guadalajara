import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { isCallerAdmin } from '../lib/admin';
import { revokeLink } from '../lib/viewerMagicLinks';

export const revokeViewerMagicLink = onCall(
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
    const linkId = String(request.data?.linkId ?? '').trim();
    if (!linkId) {
      throw new HttpsError('invalid-argument', 'linkId manquant.');
    }
    await revokeLink(linkId, {
      uid: request.auth.uid,
      email: String(request.auth.token.email ?? '').trim().toLowerCase(),
    });
    return { ok: true, linkId };
  }
);

