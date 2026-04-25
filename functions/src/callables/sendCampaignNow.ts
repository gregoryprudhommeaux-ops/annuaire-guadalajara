import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { sendCampaignById } from '../lib/campaign';

const ADMIN_EMAIL = 'chinois2001@gmail.com';
const HARDCODED_ADMIN_UID = 'HiSztwqyDXUZ5RalOyqUP3BJd6Y2';

async function isCallerAdmin(
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
