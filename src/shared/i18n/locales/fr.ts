import { FR } from '@/i18n/fr';

/** Textes « coque » (nav, réseau, pied de page) — FR de référence. */
const shell = {
  nav: {
    home: 'Accueil',
    network: 'Réseau',
    requests: 'Demandes',
    radar: 'Radar',
    myProfile: 'Mon profil',
    admin: 'Admin',
    backHome: "Retour à l'accueil",
  },
  network: {
    search: {
      eyebrow: 'RECHERCHE',
      memberCompanyNeedAria: 'Rechercher un membre, une entreprise ou un besoin',
    },
    recommendations: {
      eyebrow: 'RECOMMANDATIONS',
      title: 'Profils recommandés pour vous',
      subtitle:
        'Basé sur vos besoins actuels, votre activité et vos centres d’intérêt.',
      aria: 'Profils recommandés pour vous',
    },
    profileFallback: 'Profil',
    compatLevel: {
      veryRelevant: 'Très pertinent',
      relevant: 'Pertinent',
      explore: 'À explorer',
    },
    compatReason: {
      needMatch: 'Besoin compatible',
      canHelp: 'Peut vous aider',
      sameSector: 'Même secteur',
      sameCity: 'Même ville',
      passion: 'Passion commune',
      mentoring: 'Ouvert au mentorat',
      keywords: 'Mots-clés proches',
    },
    filters: {
      sectorAll: 'Secteur',
      profileAll: 'Profil',
      locationAll: 'Lieux',
      company: 'Entreprise',
      member: 'Membre',
      other: 'Autre',
    },
    memberCard: {
      noStructuredNeed: 'Aucun besoin structuré renseigné',
      companyUnknown: 'Entreprise non renseignée',
      sectorUnknown: 'Secteur non renseigné',
      cardAria: 'Profil de {name}',
      bioIncomplete: 'Présentation à compléter.',
      currentNeedsLabel: 'BESOINS ACTUELS',
      matchTitleStrong: 'Ils ont besoin de toi',
      matchTitleSoft: 'Tu peux probablement aider',
      matchReasonForNeeds: 'Ton profil semble pertinent pour : {needs}',
    },
    scoreLabel: 'Pertinence : {score} sur 5',
    recommendedCard: {
      openProfileAria: 'Ouvrir le profil de {name}',
      saveAria: 'Sauvegarder pour plus tard',
      savedAria: 'Retirer des profils suivis',
      labelSaved: 'Enregistré',
      labelFollow: 'Suivre',
      hideRecoAria: 'Ne plus me recommander ce profil',
      alreadyKnow: 'Je le connais déjà',
      viewProfile: 'Voir le profil',
    },
    savedPanel: {
      title: 'Contacts sauvegardés',
      description:
        'Retrouver vos profils enregistrés et votre approche suggérée',
      titleEmpty: 'Aucun contact sauvegardé pour le moment',
      openAria: 'Afficher les {count} contacts sauvegardés dans l’annuaire',
    },
  },
  footer: {
    privacy: 'Politique de confidentialité',
    terms: "Conditions d'utilisation",
    contact: 'Contact',
  },
} as const;

export const fr = {
  ...FR,
  common: {
    ...FR.common,
    viewProfile: 'Voir le profil',
    learnMore: 'En savoir plus',
    loading: 'Chargement…',
    noResults: 'Aucun résultat',
    search: 'Rechercher',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
  },
  nav: shell.nav,
  network: shell.network,
  footer: shell.footer,
} as const;
