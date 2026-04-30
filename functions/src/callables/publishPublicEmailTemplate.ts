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
    const tag = 'publishPublicEmailTemplate';
    const uid = request.auth?.uid;
    const email = request.auth?.token?.email ?? null;
    logger.info(`${tag}: start`, { uid, email });

    if (!request.auth) {
      throw new HttpsError('unauthenticated', `${tag}: auth required`);
    }

    let ok = false;
    try {
      ok = await isCallerAdmin(request.auth.uid, email);
    } catch (err) {
      logger.error(`${tag}: admin check failed`, {
        uid: request.auth.uid,
        email,
        err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      });
      throw new HttpsError('internal', `${tag}: admin check failed`);
    }
    if (!ok) {
      throw new HttpsError('permission-denied', `${tag}: admin only`);
    }

    const templateId = String((request.data as Input | undefined)?.templateId ?? '').trim();
    const name = String((request.data as Input | undefined)?.name ?? '').trim();
    const subject = String((request.data as Input | undefined)?.subject ?? '').trim();
    const bodyHtml = String((request.data as Input | undefined)?.bodyHtml ?? '').trim();

    if (!templateId) throw new HttpsError('invalid-argument', `${tag}: templateId missing`);
    if (!subject || !bodyHtml) {
      throw new HttpsError('invalid-argument', `${tag}: subject/bodyHtml missing`);
    }

    try {
      const app = getApps()[0];
      if (!app) throw new Error('firebase-admin app not initialized');
      const db = getFirestore(app, FIRESTORE_DATABASE_ID);
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
      logger.error(`${tag}: firestore write failed`, {
        templateId,
        uid: request.auth.uid,
        email,
        err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      });
      throw new HttpsError(
        'internal',
        `${tag}: firestore write failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    logger.info(`${tag}: ok`, { templateId, uid: request.auth.uid });
    return { ok: true, id: templateId };
  }
);

