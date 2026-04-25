import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { sendCampaignById } from '../lib/campaign';

/**
 * Toutes les 5 min : récupère les campagnes status='scheduled' dont scheduledAt <= now
 * et déclenche leur envoi. Les campagnes sont marquées 'sending' immédiatement
 * dans `sendCampaignById`, ce qui évite la double exécution si deux instances
 * du scheduler se chevauchent (race-condition côté Firestore).
 */
export const dispatchScheduledCampaigns = onSchedule(
  {
    schedule: 'every 5 minutes',
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
    const now = Timestamp.now();
    const snap = await db
      .collection('emailCampaigns')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now)
      .limit(20)
      .get();

    if (snap.empty) return;

    logger.info('Campagnes programmées à envoyer', { count: snap.size });

    for (const doc of snap.docs) {
      try {
        await sendCampaignById(doc.id);
      } catch (err) {
        logger.error('Échec envoi campagne programmée', { id: doc.id, err });
      }
    }
  }
);
