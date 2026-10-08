import type { Language, UserProfile } from '@/types';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import { getPublicSiteOrigin, getSignupJoinUrl } from '@/lib/siteUrls';
import { needOptionLabel, sanitizeHighlightedNeeds } from '@/needOptions';
import { pickLang } from '@/lib/uiLocale';

/** Texte libre « ce que je cherche » (express / fiche). */
export function getProfileSeekingText(p: UserProfile): string {
  return (p.networkGoal || p.lookingFor || '').trim();
}

/**
 * Manque communautaire (express : `communityGap` ou, à défaut, `helpNewcomers`).
 * Sur fiche complète, `helpNewcomers` reste une offre d’aide — pas un besoin.
 */
export function getProfileCommunityGapText(p: UserProfile): string {
  const isExpress = p.onboardingSource === 'express';
  return (p.communityGap || (isExpress ? p.helpNewcomers : '') || '').trim();
}

/** Besoins texte libre à afficher (ordre : cherche → gap). */
export function getProfileFreeNeedTexts(p: UserProfile): string[] {
  return [getProfileSeekingText(p), getProfileCommunityGapText(p)].filter(Boolean);
}

/** Labels structurés + textes libres pour une fiche annuaire. */
export function getDirectoryCardNeedLines(p: UserProfile, lang: Language): string[] {
  const structured = sanitizeHighlightedNeeds(p.highlightedNeeds).map((id) =>
    needOptionLabel(id, lang)
  );
  return [...structured, ...getProfileFreeNeedTexts(p)];
}

export function hasDirectoryCardNeeds(p: UserProfile): boolean {
  return (
    sanitizeHighlightedNeeds(p.highlightedNeeds).length > 0 ||
    getProfileFreeNeedTexts(p).length > 0
  );
}

function resolveNeedShareUrls(profile: UserProfile): { profileUrl: string; joinUrl: string; name: string } {
  const name =
    formatPersonName(profile.fullName || '') ||
    (profile.companyName || '').trim() ||
    '—';
  const origin =
    getPublicSiteOrigin() ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return {
    name,
    profileUrl: `${origin}/profil/${encodeURIComponent(profile.uid)}`,
    joinUrl: getSignupJoinUrl(),
  };
}

function formatNeedLinesBlock(needLines: string[]): string {
  return (
    needLines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `• ${line}`)
      .join('\n') || '—'
  );
}

/**
 * Message WhatsApp / e-mail : besoin(s) + lien fiche + invitation à s’inscrire.
 * Aucun téléphone / e-mail / WhatsApp du membre.
 */
export function buildNeedShareWhatsAppMessage(opts: {
  profile: UserProfile;
  lang: Language;
  needLines: string[];
}): string {
  const { profile, lang, needLines } = opts;
  const { name, profileUrl, joinUrl } = resolveNeedShareUrls(profile);
  const needsBlock = formatNeedLinesBlock(needLines);

  return pickLang(
    `Besoin FrancoNetwork — ${name}\n\n${needsBlock}\n\nVoir la fiche (le contact s’affiche après inscription) :\n${profileUrl}\n\nRejoindre le réseau :\n${joinUrl}`,
    `Necesidad FrancoNetwork — ${name}\n\n${needsBlock}\n\nVer la ficha (el contacto aparece tras registrarse):\n${profileUrl}\n\nUnirse a la red:\n${joinUrl}`,
    `FrancoNetwork need — ${name}\n\n${needsBlock}\n\nView the profile (contact appears after signup):\n${profileUrl}\n\nJoin the network:\n${joinUrl}`,
    lang
  );
}

/** Corps e-mail un peu plus explicite (admin → contact hors base). */
export function buildNeedShareEmailBody(opts: {
  profile: UserProfile;
  lang: Language;
  needLines: string[];
}): string {
  const { profile, lang, needLines } = opts;
  const { name, profileUrl, joinUrl } = resolveNeedShareUrls(profile);
  const needsBlock = formatNeedLinesBlock(needLines);

  return pickLang(
    `Bonjour,\n\nJe te partage un besoin publié sur FrancoNetwork (communauté d’affaires francophone de Guadalajara) — tu pourrais peut-être y répondre ou connaître la bonne personne.\n\nMembre : ${name}\n\nBesoin(s) :\n${needsBlock}\n\nVoir la fiche (le contact du membre s’affiche uniquement après inscription) :\n${profileUrl}\n\nCréer un compte pour rejoindre le réseau :\n${joinUrl}\n\nÀ bientôt,\n`,
    `Hola,\n\nTe comparto una necesidad publicada en FrancoNetwork (comunidad de negocios francófona de Guadalajara) — quizás puedas responder o conozcas a la persona adecuada.\n\nMiembro: ${name}\n\nNecesidad(es):\n${needsBlock}\n\nVer la ficha (el contacto del miembro solo aparece tras registrarse):\n${profileUrl}\n\nCrear una cuenta para unirse a la red:\n${joinUrl}\n\nSaludos,\n`,
    `Hi,\n\nI’m sharing a need posted on FrancoNetwork (Francophone business community in Guadalajara) — you might be able to help or know the right person.\n\nMember: ${name}\n\nNeed(s):\n${needsBlock}\n\nView the profile (the member’s contact only appears after signup):\n${profileUrl}\n\nCreate an account to join the network:\n${joinUrl}\n\nBest,\n`,
    lang
  );
}

export function buildNeedShareEmailSubject(opts: {
  profile: UserProfile;
  lang: Language;
}): string {
  const { profile, lang } = opts;
  const { name } = resolveNeedShareUrls(profile);
  return pickLang(
    `Besoin FrancoNetwork — ${name}`,
    `Necesidad FrancoNetwork — ${name}`,
    `FrancoNetwork need — ${name}`,
    lang
  );
}

export function openNeedShareWhatsApp(message: string): void {
  const text = message.trim();
  if (!text) return;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

/** Ouvre le client mail (mailto) — destinataire vide pour que l’admin choisisse. */
export function openNeedShareEmail(opts: { subject: string; body: string }): void {
  const subject = opts.subject.trim();
  const body = opts.body.trim();
  if (!subject && !body) return;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
