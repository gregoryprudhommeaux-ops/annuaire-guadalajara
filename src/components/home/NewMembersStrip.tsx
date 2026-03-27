import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';
import type { UserProfile } from '../../types';
import type { HomeLandingCopy } from '../../copy/homeLanding';
import { activityCategoryLabel, CITIES, cityOptionLabel } from '../../constants';
import type { Language } from '../../types';
import { cn } from '../../cn';
import { pickLang } from '../../lib/uiLocale';
import ProfileAvatar from '../ProfileAvatar';

type Props = {
  copy: HomeLandingCopy;
  lang: Language;
  profiles: UserProfile[];
  totalNewThisWeek: number;
  onSeeAll: () => void;
  /** Ouvre la fiche (ex. modal annuaire). */
  onOpenProfile?: (p: UserProfile) => void;
  className?: string;
  /** Variante plus compacte (utilisée pour alignement desktop connecté). */
  compact?: boolean;
  /** Invité : photo & secteur floutés ; nom + société seuls nets. */
  guestTeaser?: boolean;
};

/**
 * Retire un suffixe « · Ville » si la fin correspond à une ville du répertoire ou à `profileCity`
 * (anciennes données / chaînes concaténées). Même logique mobile & desktop.
 */
function stripTrailingCityFromSectorLine(
  label: string,
  lang: Language,
  profileCity?: string
): string {
  const t = label.trim();
  if (!t) return t;
  const sep = ' · ';
  const idx = t.lastIndexOf(sep);
  if (idx <= 0) return t;
  const tail = t.slice(idx + sep.length).trim();
  if (!tail) return t.slice(0, idx).trim();
  for (const c of CITIES) {
    if (
      tail === c ||
      tail === cityOptionLabel(c, 'fr') ||
      tail === cityOptionLabel(c, 'es') ||
      tail === cityOptionLabel(c, 'en')
    ) {
      return t.slice(0, idx).trim();
    }
  }
  const pc = profileCity?.trim();
  if (pc && tail === pc) return t.slice(0, idx).trim();
  return t;
}

/** Bandeau « nouveaux membres cette semaine » — cartes compactes + lien vers liste récente. */
export default function NewMembersStrip({
  copy,
  lang,
  profiles,
  totalNewThisWeek,
  onSeeAll,
  onOpenProfile,
  className,
  compact = false,
  guestTeaser = false,
}: Props) {
  const display = profiles.slice(0, 4);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <section
      className={cn(
        'flex min-h-0 min-w-0 flex-col rounded-2xl border border-stone-200 bg-white text-left shadow-sm',
        compact ? 'px-4 py-3 sm:px-5 sm:py-4' : 'px-4 py-4 sm:px-6 sm:py-5',
        className
      )}
      aria-labelledby="home-new-members-title"
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 sm:text-left text-center sm:mx-0 mx-auto">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2
              id="home-new-members-title"
              className="text-base font-bold tracking-tight text-stone-900 break-words hyphens-auto sm:text-lg"
            >
              {copy.newMembersTitle}
            </h2>
            {totalNewThisWeek > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                {totalNewThisWeek}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            'absolute right-0 top-0 mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full p-2 text-stone-500 transition-colors sm:hidden',
            'hover:bg-stone-200/60 hover:text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
          )}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? pickLang('Fermer', 'Cerrar', 'Close', lang) : pickLang('Ouvrir', 'Abrir', 'Open', lang)}
        >
          {mobileOpen ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
        </button>
      </div>

      {display.length === 0 ? (
        <p className={cn('mt-4 text-sm text-stone-500 break-words hyphens-auto', !mobileOpen && 'hidden sm:block')}>
          {copy.newMembersEmpty}
        </p>
      ) : (
        <>
          {/* Max 2 colonnes ; secteur sans ville (mobile + desktop) */}
          <ul
            className={cn(
              'grid min-h-0 grid-cols-1 content-stretch gap-3 sm:grid-cols-2',
              compact ? 'mt-3 sm:gap-3' : 'mt-4 sm:gap-4',
              !mobileOpen && 'hidden sm:grid'
            )}
          >
          {display.map((p) => {
            const sectorLabel = stripTrailingCityFromSectorLine(
              activityCategoryLabel(p.activityCategory, lang),
              lang,
              p.city
            );
            const cardInner = (
              <>
                <div
                  className={cn(
                    'relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-stone-200 sm:h-12 sm:w-12',
                    guestTeaser && 'ring-stone-300'
                  )}
                >
                  {guestTeaser ? (
                    <>
                      <div
                        className="pointer-events-none absolute inset-0 z-0 scale-125 blur-md opacity-70"
                        aria-hidden
                      >
                        <ProfileAvatar
                          photoURL={p.photoURL}
                          fullName={p.fullName}
                          className="h-full w-full bg-white"
                          initialsClassName="text-[11px] font-bold text-blue-800 sm:text-xs"
                          iconSize={18}
                        />
                      </div>
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/35">
                        <Lock className="h-3.5 w-3.5 text-stone-500 sm:h-4 sm:w-4" strokeWidth={2} aria-hidden />
                      </div>
                    </>
                  ) : (
                    <ProfileAvatar
                      photoURL={p.photoURL}
                      fullName={p.fullName}
                      className="h-full w-full bg-white"
                      initialsClassName="text-[11px] font-bold text-blue-800 sm:text-xs"
                      iconSize={18}
                    />
                  )}
                </div>
                <div className={cn('flex min-w-0 flex-1 flex-col justify-center gap-1 text-left', compact ? 'min-h-[3.75rem]' : 'min-h-[4.25rem]')}>
                  <p className="truncate text-sm font-semibold leading-tight text-stone-900 sm:text-[15px]" title={p.fullName}>
                    {p.fullName}
                  </p>
                  <p className="truncate text-xs leading-tight text-stone-600 sm:text-sm" title={p.companyName}>
                    {p.companyName}
                  </p>
                  {guestTeaser ? (
                    <p
                      className="truncate text-left text-[11px] leading-tight text-stone-400 blur-[5px] select-none sm:text-xs"
                      aria-hidden
                    >
                      {sectorLabel ? '············' : '—'}
                    </p>
                  ) : (
                    <p
                      className="truncate text-left text-[11px] leading-tight text-stone-500 sm:text-xs"
                      title={sectorLabel || undefined}
                    >
                      {sectorLabel || '—'}
                    </p>
                  )}
                </div>
              </>
            );
            const cardClass = cn(
              'flex h-full w-full items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/80',
              compact ? 'min-h-[5.25rem] p-2.5 sm:min-h-[5.5rem] sm:p-3' : 'min-h-[5.75rem] p-3 sm:min-h-[6rem] sm:p-3.5'
            );
            return (
              <li key={p.uid} className="flex min-h-0 min-w-0">
                {onOpenProfile ? (
                  <button
                    type="button"
                    onClick={() => onOpenProfile(p)}
                    className={cn(
                      cardClass,
                      'text-left transition-colors hover:border-stone-200 hover:bg-stone-100/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                    )}
                    aria-label={pickLang(
                      `Ouvrir la fiche de ${p.fullName}`,
                      `Abrir la ficha de ${p.fullName}`,
                      `Open profile: ${p.fullName}`,
                      lang
                    )}
                  >
                    {cardInner}
                  </button>
                ) : (
                  <div className={cardClass}>{cardInner}</div>
                )}
              </li>
            );
          })}
          </ul>
        </>
      )}

      <div
        className={cn(
          'border-t border-stone-100',
          compact ? 'mt-2.5 pt-2 sm:mt-3 sm:pt-2.5' : 'mt-3 pt-2.5 sm:mt-4 sm:pt-3',
          !mobileOpen && 'hidden sm:block'
        )}
      >
        <button
          type="button"
          data-testid="new-members-see-all"
          onClick={onSeeAll}
          className="block w-full text-left text-sm font-semibold text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline sm:inline sm:w-auto"
        >
          {copy.newMembersSeeAll}
        </button>
      </div>
    </section>
  );
}
