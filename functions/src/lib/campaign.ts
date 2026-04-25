import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { getResend, RESEND_FROM_PARAM, APP_URL_PARAM } from './resend';
import { renderTemplate } from './sendEmail';
import { resolveAudience, type AudienceFilter } from './audience';
import { CampaignEmail } from '../emails/CampaignEmail';

export type CampaignDoc = {
  name: string;
  subject: string;
  bodyHtml: string;
  audience: AudienceFilter;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt?: Timestamp | null;
  sentAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  stats?: {
    recipients: number;
    succeeded: number;
    failed: number;
  };
  lastError?: string | null;
};

const BATCH_SIZE = 100;

/**
 * Envoie une campagne enregistrée dans `emailCampaigns/{id}`.
 * Idempotent via le statut : refuse l'envoi si la campagne est `sending` ou `sent`.
 */
export async function sendCampaignById(campaignId: string): Promise<{
  recipients: number;
  succeeded: number;
  failed: number;
}> {
  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  const ref = db.collection('emailCampaigns').doc(campaignId);

  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error(`Campagne introuvable : ${campaignId}`);
  }
  const data = snap.data() as CampaignDoc;

  if (data.status === 'sending' || data.status === 'sent') {
    logger.info('Campagne déjà en cours / envoyée, skip', {
      campaignId,
      status: data.status,
    });
    return data.stats ?? { recipients: 0, succeeded: 0, failed: 0 };
  }

  await ref.update({
    status: 'sending',
    updatedAt: FieldValue.serverTimestamp(),
    lastError: null,
  });

  try {
    const audience = await resolveAudience(data.audience);
    if (audience.length === 0) {
      const stats = { recipients: 0, succeeded: 0, failed: 0 };
      await ref.update({
        status: 'sent',
        sentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        stats,
      });
      return stats;
    }

    const appUrl = APP_URL_PARAM.value();
    const from = RESEND_FROM_PARAM.value();
    const resend = getResend();

    const { html, text } = await renderTemplate(
      CampaignEmail({
        title: data.name,
        bodyHtml: data.bodyHtml,
        appUrl,
      })
    );

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < audience.length; i += BATCH_SIZE) {
      const chunk = audience.slice(i, i + BATCH_SIZE);
      const payloads = chunk.map((m) => ({
        from,
        to: m.email,
        subject: data.subject,
        html,
        text,
        tags: [
          { name: 'campaign', value: campaignId },
          { name: 'category', value: 'campaign' },
        ],
      }));
      try {
        const res = await resend.batch.send(payloads);
        if (res.error) {
          failed += chunk.length;
          logger.error('Resend batch error', {
            campaignId,
            i,
            err: res.error,
          });
        } else {
          succeeded += chunk.length;
        }
      } catch (err) {
        failed += chunk.length;
        logger.error('Resend batch exception', { campaignId, i, err });
      }
    }

    const stats = { recipients: audience.length, succeeded, failed };
    await ref.update({
      status: failed === 0 ? 'sent' : 'sent',
      sentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      stats,
    });
    logger.info('Campagne envoyée', { campaignId, ...stats });
    return stats;
  } catch (err) {
    await ref.update({
      status: 'failed',
      updatedAt: FieldValue.serverTimestamp(),
      lastError: String(err instanceof Error ? err.message : err),
    });
    throw err;
  }
}
