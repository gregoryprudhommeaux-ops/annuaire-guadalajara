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
}

export function translationDiffersFromSource(source: string, translated: string): boolean {
  return norm(translated) !== norm(source);
}
