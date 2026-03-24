import React, { useId, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../cn';

type Props = {
  title: string;
  body: string;
  className?: string;
  /** Repliable sur tous les écrans (si true). */
  collapsible?: boolean;
  /** Sur les écrans &lt; sm : bouton pour replier le corps et libérer de la hauteur. */
  collapsibleOnMobile?: boolean;
  /** État initial mobile (ouvert par défaut si non précisé). */
  mobileDefaultOpen?: boolean;
  mobileShowIntroLabel?: string;
  mobileHideIntroLabel?: string;
};

/** Encart sombre de contexte (texte d’accueil), sans CTA — repli possible sur mobile. */
export default function WelcomeContextCard({
  title,
  body,
  className,
  collapsible = false,
  collapsibleOnMobile = false,
  mobileDefaultOpen = true,
  mobileShowIntroLabel = 'Show introduction',
  mobileHideIntroLabel = 'Hide introduction',
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(mobileDefaultOpen);
  const bodyId = useId();
  const showToggle = collapsible || collapsibleOnMobile;

  return (
    <section
      className={cn(
        'relative flex h-fit w-full shrink-0 flex-col overflow-hidden rounded-2xl bg-stone-900 p-4 text-white shadow-sm sm:p-6',
        className
      )}
      aria-labelledby="welcome-context-title"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
      <div className="relative z-10">
        <div
          className={cn(
            showToggle && 'flex items-start justify-between gap-3 sm:block'
          )}
        >
          <h2
            id="welcome-context-title"
            className={cn(
              'text-base font-bold leading-snug tracking-tight text-white break-words sm:text-lg',
              showToggle && 'min-w-0 flex-1'
            )}
          >
            {title}
          </h2>
          {showToggle ? (
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className={cn(
                '-m-1 shrink-0 rounded-lg p-1.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                !collapsible && 'sm:hidden'
              )}
              aria-expanded={mobileOpen}
              aria-controls={bodyId}
              title={mobileOpen ? mobileHideIntroLabel : mobileShowIntroLabel}
            >
              {mobileOpen ? (
                <ChevronUp className="h-5 w-5" strokeWidth={2} aria-hidden />
              ) : (
                <ChevronDown className="h-5 w-5" strokeWidth={2} aria-hidden />
              )}
              <span className="sr-only">
                {mobileOpen ? mobileHideIntroLabel : mobileShowIntroLabel}
              </span>
            </button>
          ) : null}
        </div>
        <p
          id={bodyId}
          className={cn(
            'mt-3 hyphens-auto text-xs leading-relaxed text-stone-300/95 break-words sm:mt-3 sm:block sm:text-sm',
            showToggle && !mobileOpen && 'hidden'
          )}
        >
          {body}
        </p>
      </div>
    </section>
  );
}
