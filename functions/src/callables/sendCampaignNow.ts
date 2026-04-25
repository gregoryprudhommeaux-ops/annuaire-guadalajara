import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { sendCampaignById } from '../lib/campaign';
import { isCallerAdmin } from '../lib/admin';

/**
 * Callable HTTPS — déclenche l'envoi immédiat d'une campagne `emailCampaigns/{id}`.
 * Auth obligatoire + check admin (mêmes critères que firestore.rules:isAdmin()).
 */
export const sendCampaignNow = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }
    const ok = await isCallerAdmin(
      request.auth.uid,
      request.auth.token.email ?? null
    );
    if (!ok) {
      throw new HttpsError('permission-denied', 'Réservé aux admins.');
    }

    const campaignId = String(request.data?.campaignId ?? '').trim();
    if (!campaignId) {
      throw new HttpsError('invalid-argument', 'campaignId manquant.');
    }

    try {
      const stats = await sendCampaignById(campaignId);
      return { ok: true, ...stats };
    } catch (err) {
      throw new HttpsError(
        'internal',
        err instanceof Error ? err.message : 'Envoi échoué.'
      );
    }
  }
);
