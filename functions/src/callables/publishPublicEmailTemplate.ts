import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getApps } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { isCallerAdmin } from '../lib/admin';

type Input = {
  templateId: string;
  name: string;
  subject: string;
  bodyHtml: string;
};

/**
 * Publie une copie “publique” d’un template admin dans `publicEmailTemplates/{templateId}`.
 * Auth obligatoire + admin only (mêmes critères que firestore.rules:isAdmin()).
 */
export const publishPublicEmailTemplate = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
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

    const templateId = String((request.data as Input | undefined)?.templateId ?? '').trim();
    const name = String((request.data as Input | undefined)?.name ?? '').trim();
    const subject = String((request.data as Input | undefined)?.subject ?? '').trim();
    const bodyHtml = String((request.data as Input | undefined)?.bodyHtml ?? '').trim();

    if (!templateId) throw new HttpsError('invalid-argument', 'templateId manquant.');
    if (!subject || !bodyHtml) throw new HttpsError('invalid-argument', 'subject/bodyHtml manquants.');

    try {
      const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
      await db.doc(`publicEmailTemplates/${templateId}`).set(
        {
          name: name || subject,
          subject,
          bodyHtml,
          createdBy: request.auth.uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      logger.error('publishPublicEmailTemplate failed', {
        templateId,
        uid: request.auth.uid,
        email: request.auth.token.email ?? null,
        err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      });
      throw new HttpsError(
        'internal',
        err instanceof Error ? err.message : 'Publication échouée.'
      );
    }

    return { ok: true, id: templateId };
  }
);

