import type { Language } from '../types';

/**
 * Textes dédiés au bandeau d’accueil (hero, nouveaux membres, opportunités).
 * FR, ES et EN via `homeLanding(lang)` (`Language`).
 */
export type HomeLandingCopy = {
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaPrimaryBusy: string;
  ctaSecondary: string;
  steps: [string, string, string];
  newMembersTitle: string;
  newMembersBadge: string;
  newMembersSeeAll: string;
  newMembersEmpty: string;
  membersSortBanner: string;
  membersSortReset: string;
};

const HOME_LANDING: Record<'fr' | 'en' | 'es', HomeLandingCopy> = {
  fr: {
    heroTitle: 'Annuaire d’affaires francophones à Guadalajara',
    heroSubtitle:
      'Voyez en un coup d’œil qui fait quoi sur la zone, trouvez les bons contacts et rejoignez la communauté.',
    ctaPrimary: 'Créer mon profil',
    ctaPrimaryBusy: 'Connexion…',
    ctaSecondary: 'Explorer les membres',
    steps: [
      'Créez votre profil.',
      'Soyez trouvable par la communauté.',
      'Développez votre réseau sur place.',
    ],
    newMembersTitle: 'Nouveaux membres cette semaine',
    newMembersBadge: '{{n}} nouveaux membres cette semaine',
    newMembersSeeAll: 'Voir tous les derniers inscrits',
    newMembersEmpty: 'Aucun nouvel inscrit sur les 7 derniers jours.',
    membersSortBanner: 'Affichage : plus récents en premier',
    membersSortReset: 'Réinitialiser le tri',
  },
  en: {
    heroTitle: 'French-speaking business directory in Guadalajara',
    heroSubtitle:
      'See at a glance who does what in the area, find the right contacts, and join the community.',
    ctaPrimary: 'Create my profile',
    ctaPrimaryBusy: 'Signing in…',
    ctaSecondary: 'Browse members',
    steps: [
      'Create your profile.',
      'Be discoverable by the community.',
      'Grow your local network.',
    ],
    newMembersTitle: 'New members this week',
    newMembersBadge: '{{n}} new members this week',
    newMembersSeeAll: 'See all recent sign-ups',
    newMembersEmpty: 'No new sign-ups in the last 7 days.',
    membersSortBanner: 'Sorted by: newest first',
    membersSortReset: 'Reset sort order',
  },
  es: {
    heroTitle: 'Directorio de negocios francófonos en Guadalajara',
    heroSubtitle:
      'Ve de un vistazo quién hace qué en la zona, encuentra los contactos adecuados y únete a la comunidad.',
    ctaPrimary: 'Crear mi perfil',
    ctaPrimaryBusy: 'Conectando…',
    ctaSecondary: 'Explorar miembros',
    steps: [
      'Crea tu perfil.',
      'Sé visible para la comunidad.',
      'Haz crecer tu red local.',
    ],
    newMembersTitle: 'Nuevos miembros esta semana',
    newMembersBadge: '{{n}} nuevos miembros esta semana',
    newMembersSeeAll: 'Ver todos los últimos registros',
    newMembersEmpty: 'No hay nuevos registros en los últimos 7 días.',
    membersSortBanner: 'Orden: más recientes primero',
    membersSortReset: 'Restablecer orden',
  },
};

export function homeLanding(lang: Language): HomeLandingCopy {
  return HOME_LANDING[lang];
}

export function formatHomeBadge(template: string, n: number): string {
  return template.replace(/\{\{n\}\}/g, String(n));
}
