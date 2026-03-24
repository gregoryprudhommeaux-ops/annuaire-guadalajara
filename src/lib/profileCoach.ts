import type { Language, UserProfile } from '../types';
import { getProfileAiRecommendationReadiness, normalizedTargetKeywords } from '../types';
import { sanitizePassionIds } from './passionConfig';
import { sanitizeHighlightedNeeds } from '../needOptions';
import {
  hasEmployeeInfo,
  PUBLICATION_BIO_MIN_LEN,
  profileMeetsPublicationRequirements,
} from './profilePublicationRules';
import { GoogleGenAI } from '@google/genai';

export function profileCoachFingerprint(p: UserProfile): string {
  return [
    p.website ?? '',
    p.whatsapp ?? '',
    p.city ?? '',
    (p.bio ?? '').length,
    p.activityCategory ?? '',
    p.positionCategory ?? '',
    p.employeeCount ?? '',
    String(p.companySize ?? ''),
    (p.highlightedNeeds ?? []).join(','),
    (p.passionIds ?? []).join(','),
    normalizedTargetKeywords(p).join(','),
    p.linkedin ?? '',
    p.photoURL ?? '',
    p.contactPreferenceCta ?? '',
    (p.workingLanguageCodes ?? []).join(','),
    p.typicalClientSize ?? '',
  ].join('|');
}

/** Clés `TRANSLATIONS` pour les champs à compléter (ordre de priorité). */
export function collectProfileCoachGapKeys(p: UserProfile): string[] {
  const keys: string[] = [];
  const web = p.website?.trim() ?? '';
  if (!web || !/^https?:\/\/.+/i.test(web)) keys.push('website');
  if (!p.whatsapp?.trim()) keys.push('whatsapp');
  if (!p.city?.trim()) keys.push('city');
  const bio = p.bio?.trim() ?? '';
  if (bio.length < PUBLICATION_BIO_MIN_LEN) keys.push('bio');
  if (!p.activityCategory?.trim()) keys.push('activityCategory');
  if (!p.positionCategory?.trim()) keys.push('workFunction');
  const passions = sanitizePassionIds(p.passionIds);
  if (passions.length < 1) keys.push('coachGapKeywordsPassions');

  if (keys.length === 0) {
    if (!(p.linkedin?.trim())) keys.push('linkedin');
    if (!(p.photoURL?.trim())) keys.push('photoURL');
    if (!(p.contactPreferenceCta?.trim())) keys.push('contactPrefsCtaLabel');
    if (!(p.workingLanguageCodes?.length)) keys.push('contactPrefsWorkingLangLabel');
    if (!p.typicalClientSize) keys.push('contactPrefsClientSizeLabel');
  }
  return keys;
}

/**
 * Score 0–1 aligné sur `collectProfileCoachGapKeys` (mêmes critères que le texte « Conseil : … »).
 * Sert au badge « Profil: X% » pour éviter 100% + conseils contradictoires.
 */
export function getProfileCoachCompletionFraction(p: UserProfile): number {
  const web = p.website?.trim() ?? '';
  const websiteOk = web.length > 0 && /^https?:\/\/.+/i.test(web);
  const primaryChecks = [
    websiteOk,
    !!(p.whatsapp?.trim()),
    !!(p.city?.trim()),
    (p.bio?.trim() ?? '').length >= PUBLICATION_BIO_MIN_LEN,
    !!(p.activityCategory?.trim()),
    !!(p.positionCategory?.trim()),
    sanitizePassionIds(p.passionIds).length >= 1,
  ];
  const primaryPassed = primaryChecks.filter(Boolean).length;
  if (primaryPassed < primaryChecks.length) {
    return primaryPassed / primaryChecks.length;
  }
  const secondaryChecks = [
    !!(p.linkedin?.trim()),
    !!(p.photoURL?.trim()),
    !!(p.contactPreferenceCta?.trim()),
    (p.workingLanguageCodes?.length ?? 0) > 0,
    !!p.typicalClientSize,
  ];
  const secondaryPassed = secondaryChecks.filter(Boolean).length;
  return (primaryPassed + secondaryPassed) / (primaryChecks.length + secondaryChecks.length);
}

export function formatLocalProfileCoachLine(
  p: UserProfile,
  t: (key: string) => string
): string {
  const gaps = collectProfileCoachGapKeys(p);
  if (gaps.length === 0) {
    return t('profileCoachAllGood');
  }
  const labels = gaps.slice(0, 4).map((k) => t(k));
  const more = gaps.length > 4 ? ` ${t('profileCoachMoreSuffix')}` : '';
  return `${t('profileCoachPrefix')} ${labels.join(t('profileCoachSeparator'))}${more}`;
}

/**
 * Une seule phrase / un seul conseil ; pas de troncature arbitraire côté application.
 * Si le modèle renvoie plusieurs phrases, on conserve la première complète.
 */
export function normalizeAiCoachToSingleTip(raw: string): string {
  let s = raw.replace(/\s+/g, ' ').trim();
  if (!s) return s;
  s = s.replace(/\s*…\s*$/u, '').replace(/\s*\.\.\.\s*$/u, '');
  const sentences = s.split(/(?<=[.!?])\s+/u).filter(Boolean);
  if (sentences.length > 1) {
    let first = sentences[0].trim();
    if (!/[.!?]$/u.test(first)) first += '.';
    return first;
  }
  return s;
}

function pickLang<L extends string>(lang: Language, fr: L, es: L, en: L): L {
  if (lang === 'en') return en;
  if (lang === 'es') return es;
  return fr;
}

function summarizeProfileForPrompt(p: UserProfile): string {
  const web = p.website?.trim() ?? '';
  const webOk = web && /^https?:\/\/.+/i.test(web);
  return [
    `name:${p.fullName}`,
    `company:${p.companyName}`,
    `sector:${p.activityCategory ?? '—'}`,
    `role:${p.positionCategory ?? '—'}`,
    `city:${p.city ?? '—'}`,
    `website_ok:${webOk}`,
    `whatsapp:${p.whatsapp?.trim() ? 'yes' : 'no'}`,
    `bio_len:${(p.bio ?? '').trim().length}`,
    `employee_info:${hasEmployeeInfo(p) ? 'yes' : 'no'}`,
    `highlighted_needs:${sanitizeHighlightedNeeds(p.highlightedNeeds).length}`,
    `passions:${sanitizePassionIds(p.passionIds).length}`,
    `target_keywords:${normalizedTargetKeywords(p).length}`,
    `linkedin:${p.linkedin?.trim() ? 'yes' : 'no'}`,
    `photo:${p.photoURL?.trim() ? 'yes' : 'no'}`,
    `contact_cta:${p.contactPreferenceCta?.trim() ? 'yes' : 'no'}`,
    `work_langs:${(p.workingLanguageCodes ?? []).length}`,
    `typical_client_size:${p.typicalClientSize ?? '—'}`,
    `open_to:${[p.openToMentoring && 'mentor', p.openToTalks && 'talks', p.openToEvents && 'events'].filter(Boolean).join(',') || 'none'}`,
    `readiness:${getProfileAiRecommendationReadiness(p).toFixed(2)}`,
    `publishable:${profileMeetsPublicationRequirements(p)}`,
  ].join('\n');
}

/**
 * Un seul conseil IA (une phrase), ton pro B2B — pas de troncature dans la réponse.
 */
export async function fetchAiProfileCoachLine(
  apiKey: string,
  profile: UserProfile,
  lang: Language
): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey });
  const facts = summarizeProfileForPrompt(profile);
  const prompt = pickLang(
    lang,
    `Tu coaches un membre d'un annuaire B2B à Guadalajara. Données du profil (interne, une ligne par champ) :\n${facts}\n\nRéponds par UNE SEULE phrase en français : le conseil d'amélioration le plus utile (présentation, bio, ou champ manquant prioritaire). Phrase complète, 200 caractères maximum, pas de liste, pas de guillemets, pas de "Bonjour", pas de point d'exclamation multiple.`,
    `Entrenas a un miembro de un directorio B2B en Guadalajara. Datos del perfil (interno, una línea por campo):\n${facts}\n\nResponde con UNA SOLA frase en español: el consejo de mejora más útil (presentación, bio o campo faltante prioritario). Frase completa, máximo 200 caracteres, sin listas, sin comillas, sin "Hola", sin varios signos de exclamación.`,
    `You coach a member of a B2B directory in Guadalajara. Profile facts (internal, one field per line):\n${facts}\n\nReply with EXACTLY ONE English sentence: the single most useful improvement tip (pitch, bio, or top missing field). Complete sentence, max 200 characters, no bullet list, no quotes, no "Hello", no multiple exclamation marks.`
  );
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  const text = (res.text || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return normalizeAiCoachToSingleTip(text);
}
