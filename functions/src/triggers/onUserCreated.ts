import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { sendEmail, renderTemplate } from '../lib/sendEmail';
import { getResend, RESEND_FROM_PARAM, APP_URL_PARAM } from '../lib/resend';
import { computeCompletionRate, pickDisplayName } from '../lib/profileCompletion';
import { WelcomeEmail } from '../emails/WelcomeEmail';
import { CampaignEmail } from '../emails/CampaignEmail';
import {
  automationMatchesLanguage,
  hasAutomationFor,
  isTriggerEnabled,
  loadEnabledAutomations,
} from '../lib/automations';
import { buildVariables, interpolate } from '../lib/templateVars';

/**
 * Trigger Firestore v2 — base nommée. Sans `database`, le trigger ne se
 * déclenche jamais sur la base nommée du projet.
 *
 * Logique :
 *  - 0 automation `userCreated` en base → email hardcodé (WelcomeEmail) — fallback historique
 *  - 1+ automation(s) en base → on envoie celles `enabled=true` (mode Firestore)
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

    const triggerOn = await isTriggerEnabled('userCreated');
    if (!triggerOn) {
      logger.info('Welcome désactivé via appConfig, skip', {
        uid: event.params.uid,
      });
      return;
    }

    const displayName = pickDisplayName({
      displayName: data.displayName as string,
      fullName: data.fullName as string,
    });
    const completionRate = computeCompletionRate({
      fullName: data.fullName as string,
      companyName: data.companyName as string,
      photoURL: data.photoURL as string,
      activityCategory: data.activityCategory as string,
      memberBio: (data.memberBio ?? data.bio) as string,
      activityDescription: data.activityDescription as string,
    });
    const rawLang = data.communicationLanguage;
    const communicationLanguage: 'fr' | 'es' | 'en' =
      rawLang === 'fr' || rawLang === 'es' || rawLang === 'en' ? rawLang : 'es';
    const recipient = {
      uid: event.params.uid,
      email,
      fullName: (data.fullName as string) ?? null,
      displayName,
      companyName: (data.companyName as string) ?? null,
      completionRate,
      communicationLanguage,
    };
    const vars = buildVariables(recipient);

    try {
      const hasFirestoreAutomations = await hasAutomationFor('userCreated');

      if (!hasFirestoreAutomations) {
        await sendEmail({
          to: email,
          subject: 'Bienvenue sur FrancoNetwork Guadalajara',
          template: WelcomeEmail({ displayName, appUrl: APP_URL_PARAM.value() }),
          tags: [{ name: 'category', value: 'welcome' }],
        });
      } else {
        const allAutomations = await loadEnabledAutomations('userCreated');
        const automations = allAutomations.filter((a) =>
          automationMatchesLanguage(a, communicationLanguage)
        );
        if (automations.length === 0) {
          logger.info(
            'Aucune automation userCreated activée pour cette langue, aucun envoi.',
            {
              uid: event.params.uid,
              communicationLanguage,
              totalEnabled: allAutomations.length,
            }
          );
        } else {
          const resend = getResend();
          const from = RESEND_FROM_PARAM.value();
          const appUrl = APP_URL_PARAM.value();

          for (const a of automations) {
            const subject = interpolate(a.subject, vars);
            const bodyHtml = interpolate(a.bodyHtml, vars);
            const { html, text } = await renderTemplate(
              CampaignEmail({ title: a.name || subject, bodyHtml, appUrl })
            );
            try {
              const res = await resend.emails.send({
                from,
                to: email,
                subject,
                html,
                text,
                tags: [
                  { name: 'category', value: 'welcome' },
                  { name: 'automation', value: a.id.slice(0, 32) },
                ],
              });
              if (res.error) {
                logger.error('Resend welcome automation error', {
                  automationId: a.id,
                  uid: event.params.uid,
                  err: res.error,
                });
              }
            } catch (err) {
              logger.error('Resend welcome automation exception', {
                automationId: a.id,
                uid: event.params.uid,
                err,
              });
            }
          }
        }
      }

      const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
      await db.doc(`users/${event.params.uid}`).update({
        welcomeEmailSentAt: FieldValue.serverTimestamp(),
      });
      logger.info('Welcome email traité', { uid: event.params.uid, email });
    } catch (err) {
      logger.error('Welcome email failed', { uid: event.params.uid, err });
    }
  }
);
