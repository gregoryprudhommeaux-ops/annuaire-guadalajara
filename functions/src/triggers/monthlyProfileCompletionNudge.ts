import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { APP_URL_PARAM, getResend, RESEND_FROM_PARAM } from '../lib/resend';
import { renderTemplate } from '../lib/sendEmail';
import { resolveAudience } from '../lib/audience';
import {
  ProfileCompletionNudgeEmail,
  profileCompletionNudgeSubject,
} from '../emails/ProfileCompletionNudgeEmail';

const BATCH_SIZE = 80;
const CONFIG_DOC = 'appConfig/profileCompletionNudge';
const TZ = 'America/Mexico_City';

function mexicoYmNow(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${y}-${m}`;
}

/**
 * Relance mensuelle : le 15 à 8h (Guadalajara).
 * Cible : profils < 100 % ou `isValidated === false`.
 * Idempotent via `appConfig/profileCompletionNudge.lastSentYm`
 * + marqueur `users/{uid}.profileCompletionNudgeLastSentYm`.
 */
export const monthlyProfileCompletionNudge = onSchedule(
  {
    schedule: '0 8 15 * *',
    timeZone: TZ,
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    const ym = mexicoYmNow();
    const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
    const configRef = db.doc(CONFIG_DOC);
    const configSnap = await configRef.get();
    const lastSentYm = String(configSnap.data()?.lastSentYm ?? '');
    if (lastSentYm === ym) {
      logger.info('Profile completion nudge déjà envoyé ce mois, skip.', { ym });
      return;
    }

    const audience = await resolveAudience({ type: 'profileNudge' });
    if (audience.length === 0) {
      logger.info('Profile completion nudge : aucune audience.');
      await configRef.set(
        { lastSentYm: ym, updatedAt: FieldValue.serverTimestamp(), sent: 0, failed: 0 },
        { merge: true }
      );
      return;
    }

    const resend = getResend();
    const from = RESEND_FROM_PARAM.value();
    const appUrl = APP_URL_PARAM.value();
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (let i = 0; i < audience.length; i += BATCH_SIZE) {
      const chunk = audience.slice(i, i + BATCH_SIZE);
      await Promise.all(
        chunk.map(async (m) => {
          if (!m.uid) {
            skipped += 1;
            return;
          }
          try {
            const userRef = db.doc(`users/${m.uid}`);
            const userSnap = await userRef.get();
            const already = String(userSnap.data()?.profileCompletionNudgeLastSentYm ?? '');
            if (already === ym) {
              skipped += 1;
              return;
            }

            const { html, text } = await renderTemplate(
              ProfileCompletionNudgeEmail({
                displayName: m.displayName,
                completionRate: m.completionRate,
                isValidated: m.isValidated,
                appUrl,
                lang: m.communicationLanguage,
              })
            );
            const subject = profileCompletionNudgeSubject(
              m.communicationLanguage,
              m.completionRate,
              m.isValidated
            );
            const sent = await resend.emails.send({
              from,
              to: m.email,
              subject,
              html,
              text,
              tags: [
                { name: 'category', value: 'profile_completion_nudge' },
                { name: 'ym', value: ym },
              ],
            });
            if (sent.error) throw new Error(sent.error.message);
            await userRef.set(
              {
                profileCompletionNudgeLastSentYm: ym,
                profileCompletionNudgeLastSentAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
            succeeded += 1;
          } catch (err) {
            failed += 1;
            logger.error('Profile completion nudge failed', {
              uid: m.uid,
              email: m.email,
              err,
            });
          }
        })
      );
    }

    await configRef.set(
      {
        ...(failed === 0 ? { lastSentYm: ym } : { lastAttemptYm: ym }),
        updatedAt: FieldValue.serverTimestamp(),
        sent: succeeded,
        failed,
        skipped,
        audience: audience.length,
      },
      { merge: true }
    );

    logger.info('Profile completion nudge terminé', {
      ym,
      audience: audience.length,
      succeeded,
      failed,
      skipped,
    });
  }
);
