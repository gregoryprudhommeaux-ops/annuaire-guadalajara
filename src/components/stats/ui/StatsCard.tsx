import React from 'react';
import { cn } from '@/lib/cn';

/** Classe de base partagée (utile sur `<li>` si le wrapper n’est pas un `div`). */
export const statsCardClassName =
  'rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5';

/** Variante listes (lignes d’opportunités, demandes) : même conteneur que la carte, padding fixe. */
export const statsListRowClassName =
  'rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm';

type Props = React.ComponentPropsWithoutRef<'div'>;

/**
 * Carte standard (listes, KPI, lignes) — rayon, bordure, ombre, padding unifiés.
 */
export function StatsCard({ className, children, ...rest }: Props) {
  return (
    <div className={cn(statsCardClassName, className)} {...rest}>
      {children}
    </div>
  );
}
