export type AppRoute = {
  path: string;
  name: string;
  access: 'public' | 'private';
  purpose: string;
  primaryCta?: string;
};

export const appRoutes: AppRoute[] = [
  {
    path: '/',
    name: 'Homepage',
    access: 'public',
    purpose: 'Présenter la valeur du réseau, rassurer, convertir',
    primaryCta: 'Rejoindre le réseau',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    access: 'private',
    purpose: 'Guider le membre connecté vers les actions à forte valeur',
    primaryCta: 'Compléter mon profil',
  },
  {
    path: '/network',
    name: 'Network Directory',
    access: 'public',
    purpose: 'Explorer les membres, entreprises et connexions utiles',
    primaryCta: 'Voir le profil',
  },
  {
    path: '/network/member/:slug',
    name: 'Member Profile',
    access: 'public',
    purpose: 'Consulter un profil structuré et initier le contact',
    primaryCta: 'Demander une intro',
  },
  {
    path: '/requests',
    name: 'Requests',
    access: 'public',
    purpose: 'Découvrir et publier les besoins du réseau',
    primaryCta: 'Poster une demande',
  },
  {
    path: '/requests/:id',
    name: 'Request Detail',
    access: 'public',
    purpose: 'Comprendre un besoin et proposer une réponse ou connexion',
    primaryCta: 'Répondre à cette demande',
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    access: 'private',
    purpose: 'Collecter les données essentielles du membre',
    primaryCta: 'Continuer',
  },
  {
    path: '/profile/edit',
    name: 'Edit Profile',
    access: 'private',
    purpose: 'Mettre à jour les informations structurées du profil',
    primaryCta: 'Enregistrer',
  },
];

