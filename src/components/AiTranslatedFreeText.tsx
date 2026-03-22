import React, { useEffect, useState } from 'react';
import type { Language } from '../types';
import {
  cacheKeyForFreeTextTranslation,
  translateFreeTextToUiLang,
  translationDiffersFromSource,
} from '../lib/aiTranslateFreeText';
import { getGeminiApiKey } from '../lib/geminiEnv';
import { cn } from '../cn';

type TFn = (key: string) => string;

type Props = {
  lang: Language;
  t: TFn;
  text: string | null | undefined;
  className?: string;
  disclaimerClassName?: string;
  as?: 'p' | 'span' | 'div';
  whitespace?: 'pre-wrap' | 'normal';
  /** Masque la mention IA (aperçus courts : cartes, listes). */
  omitAiDisclaimer?: boolean;
};

/**
 * Affiche un texte libre traduit vers la langue UI (Gemini). Mention légale si la traduction diffère.
 * Sans clé API : texte source uniquement.
 */
export default function AiTranslatedFreeText({
  lang,
  t,
  text,
  className,
  disclaimerClassName,
  as: Tag = 'p',
  whitespace = 'normal',
  omitAiDisclaimer = false,
}: Props) {
  const src = text?.trim() ?? '';
  const [display, setDisplay] = useState(src);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    if (!src) {
      setDisplay('');
      setShowDisclaimer(false);
      return;
    }

    const key = cacheKeyForFreeTextTranslation(lang, src);
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { out: string; d: boolean };
        setDisplay(parsed.out);
        setShowDisclaimer(parsed.d);
        return;
      }
    } catch {
      sessionStorage.removeItem(key);
    }

    setDisplay(src);
    setShowDisclaimer(false);

    if (!getGeminiApiKey()) {
      return;
    }

    let cancelled = false;
    translateFreeTextToUiLang(src, lang)
      .then((out) => {
        if (cancelled) return;
        const differs = translationDiffersFromSource(src, out);
        setDisplay(out);
        setShowDisclaimer(differs);
        try {
          sessionStorage.setItem(key, JSON.stringify({ out, d: differs }));
        } catch {
          /* quota */
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDisplay(src);
          setShowDisclaimer(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src, lang]);

  if (!src) return null;

  return (
    <>
      <Tag className={cn(className, whitespace === 'pre-wrap' && 'whitespace-pre-wrap')}>{display}</Tag>
      {showDisclaimer && !omitAiDisclaimer ? (
        <p
          className={cn(
            'mt-1 text-[10px] leading-snug text-stone-400',
            disclaimerClassName
          )}
        >
          {t('aiTranslationDisclaimer')}
        </p>
      ) : null}
    </>
  );
}
