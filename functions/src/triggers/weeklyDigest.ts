import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { getResend, RESEND_FROM_PARAM, APP_URL_PARAM } from '../lib/resend';
import { renderTemplate } from '../lib/sendEmail';
import { resolveAudience } from '../lib/audience';
import { WeeklyDigestEmail } from '../emails/WeeklyDigestEmail';

const BATCH_SIZE = 100;

/**
 * Lundi 9h heure de Guadalajara (gère DST automatiquement).
 * Limite : ~9 minutes max par invocation, suffisant pour quelques milliers d'envois.
 */
export const weeklyDigest = onSchedule(
  {
    schedule: 'every monday 09:00',
    timeZone: 'America/Mexico_City',
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    const audience = await resolveAudience({ type: 'all' });
    if (audience.length === 0) {
      logger.info('Digest hebdo : aucune audience.');
      return;
    }

    const resend = getResend();
    const from = RESEND_FROM_PARAM.value();
    const appUrl = APP_URL_PARAM.value();

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < audience.length; i += BATCH_SIZE) {
      const chunk = audience.slice(i, i + BATCH_SIZE);
      const payloads = await Promise.all(
        chunk.map(async (m) => {
          const { html, text } = await renderTemplate(
            WeeklyDigestEmail({
              displayName: m.displayName,
              completionRate: m.completionRate,
              appUrl,
            })
          );
          return {
            from,
            to: m.email,
            subject: 'Votre récap hebdo FrancoNetwork',
            html,
            text,
            tags: [{ name: 'category', value: 'weekly_digest' }],
          };
        })
      );

      try {
        const res = await resend.batch.send(payloads);
        if (res.error) {
          failed += chunk.length;
          logger.error('Resend batch error (digest)', { i, err: res.error });
        } else {
          succeeded += chunk.length;
        }
      } catch (err) {
        failed += chunk.length;
        logger.error('Resend batch exception (digest)', { i, err });
      }
    }

    logger.info('Digest hebdo terminé', {
      recipients: audience.length,
      succeeded,
      failed,
    });
  }
);
