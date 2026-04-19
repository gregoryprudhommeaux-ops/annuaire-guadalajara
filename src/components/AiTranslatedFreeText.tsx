import React from 'react';
import { cn } from '../cn';

type Props = {
  text: string | null | undefined;
  className?: string;
  disclaimerClassName?: string;
  as?: 'p' | 'span' | 'div';
  whitespace?: 'pre-wrap' | 'normal';
  omitAiDisclaimer?: boolean;
  /** Conservés pour compatibilité des appels ; le contenu saisi par les membres n’est jamais remplacé selon la langue UI. */
  lang?: unknown;
  t?: unknown;
  pretranslatedByLang?: unknown;
};

/**
 * Affiche un texte libre tel que saisi (bio, description, demande…), sans traduction ni variante par langue d’interface.
 */
export default function AiTranslatedFreeText({
  text,
  className,
  as: Tag = 'p',
  whitespace = 'normal',
}: Props) {
  const src = text?.trim() ?? '';
  if (!src) return null;
  return (
    <Tag className={cn(className, whitespace === 'pre-wrap' && 'whitespace-pre-wrap')}>{src}</Tag>
  );
}
