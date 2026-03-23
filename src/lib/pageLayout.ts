/**
 * Gabarit page — padding horizontal aligné (header, main, bandeaux max-w-7xl).
 * Breakpoints : sm puis lg (cohérent partout, plus de md: uniquement sur le header).
 *
 * Couleurs UI : préférer la palette Tailwind **slate** (bordures, textes secondaires)
 * plutôt que gray ou hex (#E5E7EB, #F7F7F9…) pour rester aligné avec le shell (header, recherche).
 */

export const pagePadX = 'px-4 sm:px-6 lg:px-8';

/** Barre de titre (sticky) : largeur max + padding X */
export const pageHeaderInner = `mx-auto min-w-0 max-w-7xl py-3 ${pagePadX}`;

/** Zone principale sous le header (sans max-width : à combiner avec max-w-7xl ou max-w-none) */
export const pageMainPad = `mx-auto min-w-0 ${pagePadX} py-5 sm:py-6`;

/** Bandeau profil connecté / blocs full-bleed dans max-w-7xl */
export const pageSectionPad = `max-w-7xl mx-auto py-6 ${pagePadX}`;

/**
 * Cartes (recherche, opportunités, etc.) — moins de p-6 brutal sur très petit écran.
 */
export const cardPad = 'p-4 sm:p-5';

/**
 * CTA invité pleine largeur dans le header : compense pagePadX aux trois paliers.
 */
export const guestCtaFullBleed =
  '-mx-4 w-[calc(100%+2rem)] sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)]';
