import type { Language, UserProfile } from '../types';
import { getProfileAiRecommendationReadiness, normalizedTargetKeywords } from '../types';
import { sanitizePassionIds } from './passionConfig';
import { sanitizeHighlightedNeeds } from '../needOptions';
import {
  hasEmployeeInfo,
  PUBLICATION_BIO_MIN_LEN,
  profileMeetsPublicationRequirements,
} from './profilePublicationRules';
import {
  effectiveMemberBio,
  effectiveTypicalClientSizesForProfile,
  firstSlotActivityDescription,
} from './companyActivities';

const PROFILE_COACH_CACHE_PREFIX = 'ai_profile_coach_v1:'; // bump to invalidate
const PROFILE_COACH_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const inFlightCoach = new Map<string, Promise<string | null>>();

function coachCacheKey(fingerprint: string, lang: Language): string {
  // include lang; fingerprint already reflects profile content we use.
  return `${PROFILE_COACH_CACHE_PREFIX}${lang}:${fingerprint}`;
}

function readCoachCached(key: string): string | null {
  const storage = globalThis.localStorage;
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { out: string; ts: number };
    if (!parsed || typeof parsed.out !== 'string' || typeof parsed.ts !== 'number') return null;
    if (!Number.isFinite(parsed.ts) || parsed.ts <= 0) return null;
    if (Date.now() - parsed.ts > PROFILE_COACH_TTL_MS) {
      storage.removeItem(key);
      return null;
    }
    return parsed.out.trim() || null;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
}

function writeCoachCached(key: string, out: string) {
  const storage = globalThis.localStorage;
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify({ out, ts: Date.now() }));
  } catch {
    /* ignore quota/storage errors */
  }
}

export function profileCoachFingerprint(p: UserProfile): string {
  const tcs = effectiveTypicalClientSizesForProfile(p);
  return [
    p.website ?? '',
    p.whatsapp ?? '',
    p.city ?? '',
    (effectiveMemberBio(p) ?? '').length,
    (firstSlotActivityDescription(p) ?? '').length,
    p.activityCategory ?? '',
    p.positionCategory ?? '',
    p.employeeCount ?? '',
    String(p.companySize ?? ''),
    (p.highlightedNeeds ?? []).join(','),
    (p.passionIds ?? []).join(','),
    normalizedTargetKeywords(p).join(','),
    p.linkedin ?? '',
    p.photoURL ?? '',
    (p.workingLanguageCodes ?? []).join(','),
    tcs.join(','),
  ].join('|');
}

/** Clés `TRANSLATIONS` pour les champs à compléter (ordre de priorité). */
export function collectProfileCoachGapKeys(p: UserProfile): string[] {
  const keys: string[] = [];
  const web = p.website?.trim() ?? '';
  if (!web || !/^https?:\/\/.+/i.test(web)) keys.push('website');
  if (!p.whatsapp?.trim()) keys.push('whatsapp');
  if (!p.city?.trim()) keys.push('city');
  const mb = effectiveMemberBio(p);
  if (mb.length < PUBLICATION_BIO_MIN_LEN) keys.push('memberBio');
  const ad = firstSlotActivityDescription(p);
  if (ad.length < PUBLICATION_BIO_MIN_LEN) keys.push('activityDescription');
  if (!p.activityCategory?.trim()) keys.push('activityCategory');
  if (!p.positionCategory?.trim()) keys.push('workFunction');
  const passions = sanitizePassionIds(p.passionIds);
  if (passions.length < 1) keys.push('coachGapKeywordsPassions');

  if (keys.length === 0) {
    if (!(p.linkedin?.trim())) keys.push('linkedin');
    if (!(p.photoURL?.trim())) keys.push('photoURL');
    if (!(p.workingLanguageCodes?.length)) keys.push('contactPrefsWorkingLangLabel');
    if (effectiveTypicalClientSizesForProfile(p).length === 0) {
      keys.push('contactPrefsClientSizeLabel');
    }
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
    !!(p.activityCategory?.trim()),
    !!(p.positionCategory?.trim()),
    effectiveMemberBio(p).length >= PUBLICATION_BIO_MIN_LEN,
    firstSlotActivityDescription(p).length >= PUBLICATION_BIO_MIN_LEN,
    sanitizePassionIds(p.passionIds).length >= 1,
  ];
  const primaryPassed = primaryChecks.filter(Boolean).length;
  if (primaryPassed < primaryChecks.length) {
    return primaryPassed / primaryChecks.length;
  }
  const tcs = effectiveTypicalClientSizesForProfile(p);
  const secondaryChecks = [
    !!(p.linkedin?.trim()),
    !!(p.photoURL?.trim()),
    (p.workingLanguageCodes?.length ?? 0) > 0,
    tcs.length > 0,
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
  const tcs = effectiveTypicalClientSizesForProfile(p);
  return [
    `name:${p.fullName}`,
    `company:${p.companyName}`,
    `sector:${p.activityCategory ?? '—'}`,
    `role:${p.positionCategory ?? '—'}`,
    `city:${p.city ?? '—'}`,
    `website_ok:${webOk}`,
    `whatsapp:${p.whatsapp?.trim() ? 'yes' : 'no'}`,
    `member_bio_len:${effectiveMemberBio(p).trim().length}`,
    `activity_desc_len:${firstSlotActivityDescription(p).trim().length}`,
    `employee_info:${hasEmployeeInfo(p) ? 'yes' : 'no'}`,
    `highlighted_needs:${sanitizeHighlightedNeeds(p.highlightedNeeds).length}`,
    `passions:${sanitizePassionIds(p.passionIds).length}`,
    `target_keywords:${normalizedTargetKeywords(p).length}`,
    `linkedin:${p.linkedin?.trim() ? 'yes' : 'no'}`,
    `photo:${p.photoURL?.trim() ? 'yes' : 'no'}`,
    `work_langs:${(p.workingLanguageCodes ?? []).length}`,
    `typical_client_sizes:${tcs.length ? tcs.join(',') : '—'}`,
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
  const fp = profileCoachFingerprint(profile);
  const key = coachCacheKey(fp, lang);
  const cached = readCoachCached(key);
  if (cached) return cached;

  const existing = inFlightCoach.get(key);
  if (existing) return existing;

  const facts = summarizeProfileForPrompt(profile);
  const prompt = pickLang(
    lang,
    `Tu coaches un membre d'un annuaire B2B à Guadalajara. Données du profil (interne, une ligne par champ) :\n${facts}\n\nRéponds par UNE SEULE phrase en français : le conseil d'amélioration le plus utile (présentation, bio, ou champ manquant prioritaire). Phrase complète, 200 caractères maximum, pas de liste, pas de guillemets, pas de "Bonjour", pas de point d'exclamation multiple.`,
    `Entrenas a un miembro de un directorio B2B en Guadalajara. Datos del perfil (interno, una línea por campo):\n${facts}\n\nResponde con UNA SOLA frase en español: el consejo de mejora más útil (presentación, bio o campo faltante prioritario). Frase completa, máximo 200 caracteres, sin listas, sin comillas, sin "Hola", sin varios signos de exclamación.`,
    `You coach a member of a B2B directory in Guadalajara. Profile facts (internal, one field per line):\n${facts}\n\nReply with EXACTLY ONE English sentence: the single most useful improvement tip (pitch, bio, or top missing field). Complete sentence, max 200 characters, no bullet list, no quotes, no "Hello", no multiple exclamation marks.`
  );
  const task = (async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = (res.text || '').replace(/\s+/g, ' ').trim();
    if (!text) return null;
    const normalized = normalizeAiCoachToSingleTip(text);
    if (normalized) writeCoachCached(key, normalized);
    return normalized || null;
  })()
    .finally(() => {
      inFlightCoach.delete(key);
    });

  inFlightCoach.set(key, task);
  return task;
}
