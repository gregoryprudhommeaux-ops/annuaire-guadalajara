import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { sendEmail } from '../lib/sendEmail';
import { APP_URL_PARAM } from '../lib/resend';
import { pickDisplayName } from '../lib/profileCompletion';
import { WelcomeEmail } from '../emails/WelcomeEmail';

/**
 * Trigger Firestore v2 — base nommée. Sans `database`, le trigger ne se
 * déclenche jamais sur la base nommée du projet.
 */
export const onUserCreatedSendWelcome = onDocumentCreated(
  {
    document: 'users/{uid}',
    database: FIRESTORE_DATABASE_ID,
    region: 'us-central1',
    retry: false,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data() as Record<string, unknown> & {
      welcomeEmailSentAt?: unknown;
    };

    const email = String(data.email ?? '').trim().toLowerCase();
    if (!email) {
      logger.warn('Pas d\'email sur le doc user, skip welcome', {
        uid: event.params.uid,
      });
      return;
    }
    if (data.welcomeEmailSentAt) {
      logger.info('Welcome déjà envoyé, skip', { uid: event.params.uid });
      return;
    }

    const displayName = pickDisplayName({
      displayName: data.displayName as string,
      fullName: data.fullName as string,
    });

    try {
      await sendEmail({
        to: email,
        subject: 'Bienvenue sur FrancoNetwork Guadalajara',
        template: WelcomeEmail({ displayName, appUrl: APP_URL_PARAM.value() }),
        tags: [{ name: 'category', value: 'welcome' }],
      });

      const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
      await db.doc(`users/${event.params.uid}`).update({
        welcomeEmailSentAt: FieldValue.serverTimestamp(),
      });
      logger.info('Welcome email envoyé', { uid: event.params.uid, email });
    } catch (err) {
      logger.error('Welcome email failed', { uid: event.params.uid, err });
    }
  }
);
