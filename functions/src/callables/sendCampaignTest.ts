import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { isCallerAdmin } from '../lib/admin';
import { getResend, RESEND_FROM_PARAM, APP_URL_PARAM } from '../lib/resend';
import { renderTemplate } from '../lib/sendEmail';
import { CampaignEmail } from '../emails/CampaignEmail';

const DEFAULT_TEST_EMAIL = 'gregory.prudhommeaux@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Callable HTTPS — envoie un email de TEST de la campagne en cours d'édition
 * (avant tout envoi de masse). N'écrit rien dans Firestore.
 *
 * Body : { subject, bodyHtml, name?, to? }
 * - `to` par défaut : gregory.prudhommeaux@gmail.com
 * - le sujet est préfixé par « [TEST] »
 */
export const sendCampaignTest = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 60,
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

    const subject = String(request.data?.subject ?? '').trim();
    const bodyHtml = String(request.data?.bodyHtml ?? '');
    const name = String(request.data?.name ?? '').trim() || 'Campagne sans nom';
    const toRaw = String(request.data?.to ?? '').trim() || DEFAULT_TEST_EMAIL;

    if (!subject) {
      throw new HttpsError('invalid-argument', 'Sujet manquant.');
    }
    if (!bodyHtml) {
      throw new HttpsError('invalid-argument', 'Corps HTML vide.');
    }
    if (!EMAIL_RE.test(toRaw)) {
      throw new HttpsError('invalid-argument', `Adresse de test invalide : ${toRaw}`);
    }

    const appUrl = APP_URL_PARAM.value();
    const from = RESEND_FROM_PARAM.value();

    const { html, text } = await renderTemplate(
      CampaignEmail({ title: name, bodyHtml, appUrl })
    );

    try {
      const resend = getResend();
      const res = await resend.emails.send({
        from,
        to: toRaw,
        subject: `[TEST] ${subject}`,
        html,
        text,
        tags: [
          { name: 'category', value: 'campaign-test' },
          { name: 'sent-by', value: request.auth.uid.slice(0, 32) },
        ],
      });
      if (res.error) {
        logger.error('Resend test send error', { err: res.error, to: toRaw });
        throw new HttpsError('internal', `Resend : ${res.error.message ?? 'erreur inconnue'}`);
      }
      logger.info('Test email envoyé', { to: toRaw, id: res.data?.id });
      return { ok: true, to: toRaw, id: res.data?.id ?? null };
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      logger.error('Test email exception', { err });
      throw new HttpsError(
        'internal',
        err instanceof Error ? err.message : 'Envoi de test échoué.'
      );
    }
  }
);
