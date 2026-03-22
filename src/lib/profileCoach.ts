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
  if (!hasEmployeeInfo(p)) keys.push('employeeCount');
  if (sanitizeHighlightedNeeds(p.highlightedNeeds).length < 1) keys.push('coachGapHighlightedNeeds');
  const passions = sanitizePassionIds(p.passionIds);
  const kw = normalizedTargetKeywords(p);
  if (passions.length < 1 && kw.length < 1) keys.push('coachGapKeywordsPassions');

  if (keys.length === 0) {
    if (!(p.linkedin?.trim())) keys.push('linkedin');
    if (!(p.photoURL?.trim())) keys.push('photoURL');
    if (!(p.contactPreferenceCta?.trim())) keys.push('contactPrefsCtaLabel');
    if (!(p.workingLanguageCodes?.length)) keys.push('contactPrefsWorkingLangLabel');
    if (!p.typicalClientSize) keys.push('contactPrefsClientSizeLabel');
  }
  return keys;
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
 * Court conseil personnalisé (2 phrases max, ton pro B2B).
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
    `Tu coaches un membre d'un annuaire B2B à Guadalajara. Données du profil (interne, une ligne par champ) :\n${facts}\n\nRédige EXACTEMENT 2 phrases courtes en français (max 320 caractères au total). Conseils concrets : présentation entreprise/bio, champs vides à remplir, crédibilité. Pas de liste à puces, pas de guillemets, pas de "Bonjour".`,
    `Entrenas a un miembro de un directorio B2B en Guadalajara. Datos del perfil (interno, una línea por campo):\n${facts}\n\nEscribe EXACTAMENTE 2 frases cortas en español (máx. 320 caracteres en total). Consejos concretos: presentación de la empresa/bio, campos vacíos, credibilidad. Sin viñetas, sin comillas, sin "Hola".`,
    `You coach a member of a B2B directory in Guadalajara. Profile facts (internal, one field per line):\n${facts}\n\nWrite EXACTLY 2 short sentences in English (max 320 characters total). Concrete tips: company pitch/bio, empty fields to fill, credibility. No bullet points, no quotes, no "Hello".`
  );
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  const text = (res.text || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > 400 ? `${text.slice(0, 397)}…` : text;
}
