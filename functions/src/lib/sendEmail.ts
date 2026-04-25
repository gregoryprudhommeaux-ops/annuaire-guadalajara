import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { logger } from 'firebase-functions/v2';
import { getResend, RESEND_FROM_PARAM } from './resend';

export type SendEmailArgs = {
  to: string | string[];
  subject: string;
  template: ReactElement;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

/** Rend un template React Email puis envoie via Resend. */
export async function sendEmail(args: SendEmailArgs) {
  const resend = getResend();
  const html = await render(args.template);
  const text = await render(args.template, { plainText: true });

  const result = await resend.emails.send({
    from: RESEND_FROM_PARAM.value(),
    to: args.to,
    subject: args.subject,
    html,
    text,
    replyTo: args.replyTo,
    tags: args.tags,
  });

  if (result.error) {
    logger.error('Resend send error', { err: result.error, to: args.to });
    throw new Error(result.error.message ?? 'Resend send failed');
  }
  return result.data;
}

export type RenderedEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Rend un template une seule fois pour un grand nombre de destinataires
 * (le HTML peut différer si le template prend des props par destinataire,
 * dans ce cas appeler la fonction par destinataire).
 */
export async function renderTemplate(
  template: ReactElement
): Promise<{ html: string; text: string }> {
  const html = await render(template);
  const text = await render(template, { plainText: true });
  return { html, text };
}
