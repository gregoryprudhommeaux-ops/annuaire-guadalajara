import React from 'react';
import { cn } from '@/lib/cn';

export type StatsSectionHeaderAlign = 'left' | 'center';

type Props = {
  eyebrow: string;
  title: string;
  titleId?: string;
  description?: string;
  align?: StatsSectionHeaderAlign;
  className?: string;
  /** Phrase de transition optionnelle (sous le bloc titre / lead). */
  transition?: React.ReactNode;
  /** CTA optionnel (boutons, liens). */
  cta?: React.ReactNode;
};

/**
 * En-tête standardisé : eyebrow → titre → sous-texte → (transition) → (CTA).
 */
export function StatsSectionHeader({
  eyebrow,
  title,
  titleId,
  description,
  align = 'left',
  className,
  transition,
  cta,
}: Props) {
  const isCenter = align === 'center';
  return (
    <div
      className={cn(
        isCenter ? 'text-center' : 'text-left',
        className
      )}
    >
      <p
        className={cn(
          'text-[11px] font-bold uppercase tracking-[0.2em] sm:text-xs',
          isCenter ? 'text-[#01696f]/90' : 'text-[#01696f]'
        )}
      >
        {eyebrow}
      </p>
      <h2
        id={titleId}
        className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl"
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]',
            isCenter && 'mx-auto'
          )}
        >
          {description}
        </p>
      ) : null}
      {transition ? <div className={cn('mt-3', isCenter && 'mx-auto max-w-2xl')}>{transition}</div> : null}
      {cta ? <div className={cn('mt-4', isCenter && 'flex justify-center')}>{cta}</div> : null}
    </div>
  );
}
