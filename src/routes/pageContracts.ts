export type PageContract = {
  page: string;
  goal: string;
  audience: string[];
  allowedModules: string[];
  forbiddenModules: string[];
  primaryCta: string;
  secondaryCtas?: string[];
};

export const pageContracts: PageContract[] = [
  {
    page: '/',
    goal: 'Convaincre et orienter',
    audience: ['visiteur', 'membre non connecté', 'partenaire potentiel'],
    allowedModules: [
      'hero',
      'value-proposition',
      'network-stats',
      'featured-members',
      'featured-companies',
      'recent-requests',
      'how-it-works',
      'social-proof',
      'join-cta',
    ],
    forbiddenModules: [
      'profile-completion',
      'personal-recommendations',
      'private-member-actions',
      'edit-profile-form',
      'member-dashboard-widgets',
    ],
    primaryCta: 'Rejoindre le réseau',
    secondaryCtas: ['Explorer les membres', 'Voir les demandes'],
  },
  {
    page: '/dashboard',
    goal: 'Activer le membre connecté',
    audience: ['membre connecté'],
    allowedModules: [
      'profile-completion',
      'recommended-members',
      'recommended-requests',
      'quick-actions',
      'network-updates',
      'my-activity',
      'ai-suggestions',
    ],
    forbiddenModules: [
      'generic-marketing-hero',
      'public-landing-sections',
      'long-brand-story',
    ],
    primaryCta: 'Compléter mon profil',
    secondaryCtas: ['Poster une demande', 'Voir mes recommandations'],
  },
  {
    page: '/network',
    goal: 'Explorer efficacement le réseau',
    audience: ['visiteur', 'membre connecté'],
    allowedModules: [
      'search-bar',
      'filter-bar',
      'result-list',
      'sort-controls',
      'directory-tabs',
      'empty-state',
    ],
    forbiddenModules: [
      'dashboard-personal-summary',
      'campaign-launch-banner',
      'profile-edit-form',
    ],
    primaryCta: 'Voir le profil',
    secondaryCtas: ['Filtrer', 'Demander une intro'],
  },
  {
    page: '/requests',
    goal: 'Découvrir les besoins actifs',
    audience: ['visiteur', 'membre connecté'],
    allowedModules: [
      'request-list',
      'request-filters',
      'publish-request-cta',
      'request-categories',
      'empty-state',
    ],
    forbiddenModules: ['profile-completion', 'member-admin-panels'],
    primaryCta: 'Poster une demande',
    secondaryCtas: ['Répondre', 'Voir le profil auteur'],
  },
];

