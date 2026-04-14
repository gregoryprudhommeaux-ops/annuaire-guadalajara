/**
 * Gabarit page — padding horizontal aligné (header, main, bandeaux max-w-7xl).
 * Breakpoints : sm puis lg (cohérent partout, plus de md: uniquement sur le header).
 *
 * Couleurs UI : préférer la palette Tailwind **slate** (bordures, textes secondaires)
 * plutôt que gray ou hex (#E5E7EB, #F7F7F9…) pour rester aligné avec le shell (header, recherche).
 */

export const pagePadX = 'px-4 sm:px-6 lg:px-8';

/** Barre de titre (sticky) : largeur max + padding X */
export const pageHeaderInner = `mx-auto w-full min-w-0 max-w-7xl py-3 ${pagePadX}`;

/**
 * Zone principale sous le header : padding horizontal + vertical **une seule fois**.
 * Les enfants directs ne doivent pas répéter `pagePadX` / `py-*` sauf cas exceptionnel (full-bleed).
 */
export const pageMainPad = `mx-auto w-full min-w-0 ${pagePadX} py-5 sm:py-6`;

/** Contenu centré sous `<main>` (le padding vient déjà de `pageMainPad`). */
export const pageInnerMax = 'mx-auto w-full min-w-0 max-w-7xl';

/** Variante pleine largeur (radar, certains dashboards). */
export const pageInnerFluid = 'mx-auto w-full min-w-0 max-w-none';

/** Espacement vertical standard entre blocs majeurs d’une même page (24px). */
export const pageStack = 'flex flex-col gap-6';

/** Espacement resserré entre sous-blocs (16px). */
export const pageStackTight = 'flex flex-col gap-4';

/** Bandeau profil connecté / blocs full-bleed dans max-w-7xl */
export const pageSectionPad = `mx-auto w-full max-w-7xl py-5 sm:py-6 ${pagePadX}`;

/**
 * Cartes (recherche, opportunités, etc.) — moins de p-6 brutal sur très petit écran.
 */
export const cardPad = 'p-4 sm:p-5';

/**
 * Cartes pleine largeur dans la colonne annuaire (nouveaux membres, demandes, recommandations) :
 * même bordure, coins et gouttières pour aligner les blocs avec les onglets et les grilles.
 */
export const directoryFeedCardClass = `w-full min-w-0 rounded-2xl border border-stone-200 bg-white shadow-sm ${cardPad}`;

/**
 * CTA invité pleine largeur dans le header : compense `pagePadX` **uniquement en dessous du breakpoint sm**.
 * Ne pas répéter de marges négatives aux breakpoints sm+ : elles entrent en conflit avec
 * `sm:mx-0` du header et, avec tailwind-merge, `lg:-mx-8` peut regagner la priorité et faire
 * chevaucher le bouton « Se connecter » sur le sélecteur de langue.
 */
export const guestCtaFullBleed =
  'max-sm:-mx-4 max-sm:w-[calc(100%+2rem)]';
