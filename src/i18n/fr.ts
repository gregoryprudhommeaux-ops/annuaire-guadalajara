/**
 * Jeu de chaînes FR (structure imbriquée) — référence produit.
 * L’UI utilise `t('cléPlate')` via `TRANSLATIONS` / `EN_STRINGS` ; garder les `fr` alignés avec cet objet.
 */
export const FR = {
  common: {
    recommended: 'Recommandé',
    optional: 'Facultatif',
    required: 'Obligatoire',
  },

  home: {
    whyJoin: {
      eyebrow: 'Pourquoi rejoindre',
      title: 'Une communauté utile avant d’être volumique',
      description:
        'L’Annuaire d’Affaires de Guadalajara aide les professionnels francophones à Guadalajara à trouver rapidement les bons contacts, à mieux se recommander et à faire émerger des opportunités concrètes.',
      item1Title: 'Trouver les bons contacts',
      item1Description:
        'Identifiez rapidement un membre, une entreprise ou un besoin lié à votre activité.',
      item2Title: 'Être recommandé plus facilement',
      item2Description:
        'Un profil clair permet aux autres de comprendre en quelques secondes qui vous êtes et comment vous aider.',
      item3Title: 'Accéder à des demandes ciblées',
      item3Description:
        'Partenaires, clients, experts locaux, besoins du réseau : la plateforme structure les connexions utiles.',
    },

    first50: {
      eyebrow: 'Communauté en lancement',
      title: 'Construisons les 50 premiers profils de référence',
      description:
        'Chaque nouveau membre renforce la valeur du réseau pour tous : recommandations, demandes ciblées, connexions et opportunités à Guadalajara.',
      subline:
        'Rejoignez les premiers membres et aidez-nous à atteindre une masse critique utile.',
      progressLabel: 'Progression',
      inviteCta: 'Inviter mon réseau',
      valueLine: 'Chaque nouveau profil augmente la valeur du réseau',
    },

    sectors: {
      eyebrow: 'Déjà présents dans le réseau',
      title: 'Des profils issus de plusieurs secteurs clés',
      description:
        'Le réseau se structure déjà autour d’entreprises, d’experts et de décideurs actifs dans différents univers professionnels.',
    },
  },

  memberCard: {
    empty: {
      needs:
        'Profil en cours d’enrichissement — les besoins seront précisés prochainement.',
      help: 'Cette section sera enrichie prochainement.',
      generic: 'Profil en cours d’enrichissement.',
    },
  },

  onboarding: {
    intro: {
      title: 'Crée un profil simple maintenant, complète-le ensuite.',
      description:
        'L’objectif est d’abord de te rendre visible dans la communauté. Tu peux enrichir ton profil à tout moment pour améliorer la qualité des mises en relation.',
      step1: 'Renseigne les informations essentielles.',
      step2: 'Ajoute ce que tu cherches et ce que tu peux apporter.',
      step3: 'Complète le reste plus tard selon ton temps.',
    },
  },

  profileCompletion: {
    eyebrow: 'Visibilité du profil',
    title: 'Profil complété à {percent}%',
    description:
      'Complète en priorité les champs les plus utiles pour être trouvé et recommandé dans l’annuaire.',
    progressShort: 'complété',
    nextBestActions: 'Les prochains champs à compléter',
    completeNow: 'Compléter',
  },

  profile: {
    fields: {
      lookingFor: {
        label: 'Ce que je cherche via ce réseau',
        placeholder:
          'Ex : Développer ma clientèle B2B à Guadalajara, trouver un partenaire local...',
        help: 'Cette phrase aide les autres à comprendre rapidement comment t’aider.',
      },
      canHelpWith: {
        label: 'Je peux aider sur…',
        placeholder:
          'Ex : installation à Guadalajara, réseau F&B, mise en relation locale...',
        help: 'Explique en quoi tu peux être utile à d’autres membres du réseau.',
      },
      preferredContact: {
        label: 'Le contacter de préférence par…',
        placeholder: 'Ex : WhatsApp, Email, LinkedIn',
        help: 'Précise le canal le plus simple pour un premier échange.',
      },
    },
  },
} as const;
