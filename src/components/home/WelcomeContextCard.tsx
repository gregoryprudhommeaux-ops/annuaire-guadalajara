import React from 'react';
import { cn } from '../../cn';

type Props = {
  title: string;
  body: string;
  className?: string;
};

/** Encart sombre de contexte (texte d’accueil historique), sans CTA — aligné sur la colonne filtres. */
export default function WelcomeContextCard({ title, body, className }: Props) {
  return (
    <section
      className={cn(
        'relative flex h-fit w-full shrink-0 flex-col overflow-hidden rounded-2xl bg-stone-900 p-5 text-white shadow-sm sm:p-6',
        className
      )}
      aria-labelledby="welcome-context-title"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
      <div className="relative z-10">
        <h2
          id="welcome-context-title"
          className="text-base font-bold leading-snug tracking-tight text-white break-words sm:text-lg"
        >
          {title}
        </h2>
        <p className="mt-3 hyphens-auto text-xs leading-relaxed text-stone-300/95 break-words sm:text-sm">
          {body}
        </p>
      </div>
    </section>
  );
}
