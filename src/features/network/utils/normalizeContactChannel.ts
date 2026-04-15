/**
 * Normalise l’affichage des canaux (WhatsApp, Email, LinkedIn) sur /network.
 * Affichage uniquement — ne modifie pas les données persistées.
 */
export function normalizeContactChannelText(text: string): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (!s) return s;

  return s
    .replace(/\blinkedin|linked\s*in\b/gi, 'LinkedIn')
    .replace(/\bwhatsapp\b|what'?s?\s*app\b/gi, 'WhatsApp')
    .replace(/\bcourriels?\b|\be-?\s*mails?\b|\bemail\b|\bemails?\b/gi, 'Email');
}
