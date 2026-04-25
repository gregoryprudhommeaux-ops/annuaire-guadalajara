import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { getResend, RESEND_FROM_PARAM, APP_URL_PARAM } from '../lib/resend';
import { renderTemplate } from '../lib/sendEmail';
import { resolveAudience } from '../lib/audience';
import { WeeklyDigestEmail } from '../emails/WeeklyDigestEmail';
import { CampaignEmail } from '../emails/CampaignEmail';
import {
  hasAutomationFor,
  isTriggerEnabled,
  loadEnabledAutomations,
} from '../lib/automations';
import { buildVariables, interpolate } from '../lib/templateVars';

const BATCH_SIZE = 100;

/**
 * Lundi 9h heure de Guadalajara (gère DST automatiquement).
 *
 * Logique :
 *  - 0 automation `weeklySchedule` en base → digest hardcodé (WeeklyDigestEmail)
 *  - 1+ automation(s) en base → envoie chaque automation activée à toute l'audience.
 *    Variables interpolées par destinataire.
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
    const triggerOn = await isTriggerEnabled('weeklySchedule');
    if (!triggerOn) {
      logger.info('Digest hebdo désactivé via appConfig, skip.');
      return;
    }

    const audience = await resolveAudience({ type: 'all' });
    if (audience.length === 0) {
      logger.info('Digest hebdo : aucune audience.');
      return;
    }

    const resend = getResend();
    const from = RESEND_FROM_PARAM.value();
    const appUrl = APP_URL_PARAM.value();

    const hasFirestoreAutomations = await hasAutomationFor('weeklySchedule');
    const automations = hasFirestoreAutomations
      ? await loadEnabledAutomations('weeklySchedule')
      : [];

    if (hasFirestoreAutomations && automations.length === 0) {
      logger.info('Digest : aucune automation weeklySchedule activée, skip.');
      return;
    }

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < audience.length; i += BATCH_SIZE) {
      const chunk = audience.slice(i, i + BATCH_SIZE);

      const payloads = await Promise.all(
        chunk.map(async (m) => {
          if (automations.length === 0) {
            const { html, text } = await renderTemplate(
              WeeklyDigestEmail({
                displayName: m.displayName,
                completionRate: m.completionRate,
                appUrl,
              })
            );
            return [
              {
                from,
                to: m.email,
                subject: 'Votre récap hebdo FrancoNetwork',
                html,
                text,
                tags: [{ name: 'category', value: 'weekly_digest' }],
              },
            ];
          }
          const vars = buildVariables({
            uid: m.uid,
            email: m.email,
            displayName: m.displayName,
            fullName: m.fullName,
            completionRate: m.completionRate,
          });
          return Promise.all(
            automations.map(async (a) => {
              const subject = interpolate(a.subject, vars);
              const bodyHtml = interpolate(a.bodyHtml, vars);
              const { html, text } = await renderTemplate(
                CampaignEmail({ title: a.name || subject, bodyHtml, appUrl })
              );
              return {
                from,
                to: m.email,
                subject,
                html,
                text,
                tags: [
                  { name: 'category', value: 'weekly_digest' },
                  { name: 'automation', value: a.id.slice(0, 32) },
                ],
              };
            })
          );
        })
      );

      const flat = payloads.flat();

      try {
        const res = await resend.batch.send(flat);
        if (res.error) {
          failed += flat.length;
          logger.error('Resend batch error (digest)', { i, err: res.error });
        } else {
          succeeded += flat.length;
        }
      } catch (err) {
        failed += flat.length;
        logger.error('Resend batch exception (digest)', { i, err });
      }
    }

    logger.info('Digest hebdo terminé', {
      recipients: audience.length,
      automations: automations.length,
      succeeded,
      failed,
    });
  }
);
