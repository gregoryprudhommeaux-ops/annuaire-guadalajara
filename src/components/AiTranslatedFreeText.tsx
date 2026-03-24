import React, { useEffect, useRef, useState } from 'react';
import type { Language } from '../types';
import {
  cacheKeyForFreeTextTranslation,
  translateFreeTextToUiLang,
  translationDiffersFromSource,
} from '../lib/aiTranslateFreeText';
import { getGeminiApiKey } from '../lib/geminiEnv';
import { cn } from '../cn';

type TFn = (key: string) => string;
type CachedTranslation = { out: string; d: boolean };

function readCachedTranslation(key: string): CachedTranslation | null {
  for (const storage of [globalThis.sessionStorage, globalThis.localStorage]) {
    if (!storage) continue;
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as CachedTranslation;
      if (typeof parsed?.out === 'string' && typeof parsed?.d === 'boolean') {
        return parsed;
      }
    } catch {
      storage.removeItem(key);
    }
  }
  return null;
}

function writeCachedTranslation(key: string, value: CachedTranslation) {
  for (const storage of [globalThis.sessionStorage, globalThis.localStorage]) {
    if (!storage) continue;
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota/storage errors */
    }
  }
}

type Props = {
  lang: Language;
  t: TFn;
  text: string | null | undefined;
  /** Traduction déjà connue (ex. stockée en base) pour éviter un appel IA. */
  pretranslatedByLang?: Partial<Record<Language, string>>;
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
  pretranslatedByLang,
  className,
  disclaimerClassName,
  as: Tag = 'p',
  whitespace = 'normal',
  omitAiDisclaimer = false,
}: Props) {
  const src = text?.trim() ?? '';
  const [display, setDisplay] = useState(src);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (isInViewport) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsInViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setIsInViewport(true);
          observer.disconnect();
        }
      },
      {
        // Start translation a bit before the text is fully visible.
        root: null,
        threshold: 0.01,
        rootMargin: '120px 0px',
      }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isInViewport, src, lang]);

  useEffect(() => {
    if (!src) {
      setDisplay('');
      setShowDisclaimer(false);
      return;
    }

    // Defer expensive AI work until the text enters viewport.
    if (!isInViewport) {
      setDisplay(src);
      setShowDisclaimer(false);
      return;
    }

    const knownTranslation = pretranslatedByLang?.[lang]?.trim();
    if (knownTranslation) {
      const differs = translationDiffersFromSource(src, knownTranslation);
      setDisplay(knownTranslation);
      setShowDisclaimer(differs);
      writeCachedTranslation(cacheKeyForFreeTextTranslation(lang, src), {
        out: knownTranslation,
        d: differs,
      });
      return;
    }

    const key = cacheKeyForFreeTextTranslation(lang, src);
    const cached = readCachedTranslation(key);
    if (cached) {
      setDisplay(cached.out);
      setShowDisclaimer(cached.d);
      return;
    }

    setDisplay(src);
    setShowDisclaimer(false);

    if (!getGeminiApiKey()) {
      return;
    }

    let cancelled = false;
    const timer = globalThis.setTimeout(() => {
      translateFreeTextToUiLang(src, lang)
        .then((out) => {
          if (cancelled) return;
          const differs = translationDiffersFromSource(src, out);
          setDisplay(out);
          setShowDisclaimer(differs);
          writeCachedTranslation(key, { out, d: differs });
        })
        .catch(() => {
          if (!cancelled) {
            setDisplay(src);
            setShowDisclaimer(false);
          }
        });
    }, 100);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [src, lang, pretranslatedByLang, isInViewport]);

  if (!src) return null;

  return (
    <>
      <Tag
        ref={(node) => {
          rootRef.current = node as HTMLElement | null;
        }}
        className={cn(className, whitespace === 'pre-wrap' && 'whitespace-pre-wrap')}
      >
        {display}
      </Tag>
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
