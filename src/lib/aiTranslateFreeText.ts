import { GoogleGenAI } from '@google/genai';
import type { Language } from '../types';
import { getGeminiApiKey } from './geminiEnv';

const TARGET_LANG_NAME: Record<Language, string> = {
  fr: 'French',
  es: 'Spanish',
  en: 'English',
};

function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

const inFlightTranslations = new Map<string, Promise<string>>();
const QUOTA_COOLDOWN_KEY = 'ai_ft_quota_cooldown_until_ms';
const QUOTA_COOLDOWN_MS = 10 * 60 * 1000;
const MAX_CONCURRENT_TRANSLATIONS = 2;
let activeTranslations = 0;
const translationQueue: Array<() => void> = [];

function shouldSkipByQuotaCooldown(): boolean {
  try {
    const untilRaw = globalThis.localStorage?.getItem(QUOTA_COOLDOWN_KEY);
    const until = untilRaw ? Number(untilRaw) : 0;
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

function markQuotaCooldown() {
  try {
    globalThis.localStorage?.setItem(
      QUOTA_COOLDOWN_KEY,
      String(Date.now() + QUOTA_COOLDOWN_MS)
    );
  } catch {
    /* ignore storage errors */
  }
}

function runWithTranslationConcurrency<T>(job: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      activeTranslations += 1;
      job()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeTranslations = Math.max(0, activeTranslations - 1);
          const next = translationQueue.shift();
          if (next) next();
        });
    };

    if (activeTranslations < MAX_CONCURRENT_TRANSLATIONS) {
      start();
      return;
    }
    translationQueue.push(start);
  });
}

function looksMostlySpanish(text: string): boolean {
  return /\b(el|la|los|las|de|del|para|con|que|por|una|un|es)\b/i.test(text);
}

function looksMostlyFrench(text: string): boolean {
  return /\b(le|la|les|des|pour|avec|que|une|un|est|dans|sur)\b/i.test(text);
}

function looksMostlyEnglish(text: string): boolean {
  return /\b(the|and|for|with|from|to|of|is|are|this|that)\b/i.test(text);
}

function likelyTextLanguage(text: string): Language | null {
  const t = text.trim();
  if (!t) return null;
  if (looksMostlySpanish(t)) return 'es';
  if (looksMostlyFrench(t)) return 'fr';
  if (looksMostlyEnglish(t)) return 'en';
  return null;
}

export function cacheKeyForFreeTextTranslation(lang: Language, text: string): string {
  const t = text.trim();
  let h = 5381;
  for (let i = 0; i < t.length; i++) {
    h = (h * 33) ^ t.charCodeAt(i);
  }
  return `ai_ft_v1_${lang}_${(h >>> 0).toString(16)}_${t.length}`;
}

/**
 * Traduit un texte libre vers la langue d’interface. Sans clé API, renvoie le texte d’origine.
 */
export async function translateFreeTextToUiLang(text: string, targetLang: Language): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const apiKey = getGeminiApiKey();
  if (!apiKey) return trimmed;
  if (shouldSkipByQuotaCooldown()) return trimmed;

  const likelyLang = likelyTextLanguage(trimmed);
  if (likelyLang === targetLang) {
    // Avoid Gemini call when text already appears in target language.
    return trimmed;
  }

  const key = cacheKeyForFreeTextTranslation(targetLang, trimmed);
  const existing = inFlightTranslations.get(key);
  if (existing) return existing;

  const task = runWithTranslationConcurrency(async () => {
    const target = TARGET_LANG_NAME[targetLang];
    const safe = trimmed.length > 12000 ? `${trimmed.slice(0, 12000)}…` : trimmed;
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Translate the following user-written text into ${target} for a B2B business directory. Preserve meaning, tone, and meaningful line breaks. Output ONLY the translation — no quotes, no title, no "Here is the translation".

Text:
"""
${safe}
"""`;

    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const out = (res.text || '').trim();
    return out || trimmed;
  })
    .catch((err) => {
      const msg = String((err as { message?: string })?.message ?? err ?? '');
      if (
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('Quota') ||
        msg.includes('quota')
      ) {
        markQuotaCooldown();
      }
      throw err;
    })
    .finally(() => {
      inFlightTranslations.delete(key);
    });

  inFlightTranslations.set(key, task);
  return task;
}

export function translationDiffersFromSource(source: string, translated: string): boolean {
  return norm(translated) !== norm(source);
}
