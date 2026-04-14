import React from 'react';
import { cn } from '../../cn';

export type HeroSearchSectionProps = {
  /** Carte d’accueil (ex. `WelcomeContextCard`). */
  welcome: React.ReactNode;
  /** Bloc promesse + CTA (ex. `HeroSection`). */
  hero: React.ReactNode;
  /** Filtres + recherche annuaire (ex. `SearchBlock`). */
  search: React.ReactNode;
  className?: string;
};

/**
 * Accueil visiteurs : bienvenue + hero sur une ligne desktop, recherche en dessous pleine largeur.
 */
export function HeroSearchSection({
  welcome,
  hero,
  search,
  className,
}: HeroSearchSectionProps) {
  return (
    <div className={cn('w-full min-w-0 space-y-6', className)}>
      <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        <div className="h-full min-h-0 min-w-0 lg:col-span-4">{welcome}</div>
        <div className="h-full min-h-0 min-w-0 lg:col-span-8">{hero}</div>
      </div>
      <div className="min-w-0 w-full">{search}</div>
    </div>
  );
}

export default HeroSearchSection;
