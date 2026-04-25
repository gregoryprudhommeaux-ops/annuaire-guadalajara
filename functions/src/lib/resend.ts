import { Resend } from 'resend';
import { defineString } from 'firebase-functions/params';

const resendApiKey = defineString('RESEND_API_KEY');

export const RESEND_FROM_PARAM = defineString('RESEND_FROM', {
  default: 'onboarding@resend.dev',
});

export const APP_URL_PARAM = defineString('APP_URL', {
  default: 'https://franconetwork.app',
});

let cached: Resend | null = null;

/** Singleton réutilisé entre invocations chaudes ; lit la clé au premier accès. */
export function getResend(): Resend {
  if (cached) return cached;
  const key = resendApiKey.value();
  if (!key) {
    throw new Error(
      'RESEND_API_KEY manquant. Voir functions/email-config.example.env.'
    );
  }
  cached = new Resend(key);
  return cached;
}
