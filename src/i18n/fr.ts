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
      inviteChannelsHint: 'Invitez vos contacts pour atteindre les 50 profils :',
      inviteWhatsappCta: 'WhatsApp',
      inviteEmailCta: 'E-mail',
      inviteLinkCta: 'Ouvrir la page d’inscription',
      valueLine: 'Chaque nouveau profil augmente la valeur du réseau',
    },

    sectors: {
      eyebrow: 'Déjà présents dans le réseau',
      title: 'Des profils issus de plusieurs secteurs clés',
      description:
        'Le réseau se structure déjà autour d’entreprises, d’experts et de décideurs actifs dans différents univers professionnels.',
    },

    marketing: {
      introP1:
        'Bienvenue dans l’annuaire de la communauté d’affaires francophone de Guadalajara.',
      introP2:
        'Découvrez les entreprises et membres déjà inscrits, filtrez par secteur, profil ou localisation, puis explorez les premiers profils suggérés.',
      heroTitle: 'Annuaire d’affaires francophones à Guadalajara',
      heroLead:
        'Voyez en un coup d’œil qui fait quoi sur la zone, trouvez les bons contacts et rejoignez la communauté.',
      ctaCreateProfile: 'Créer mon profil',
      ctaExploreMembers: 'Explorer les membres',
      benefit1: 'Créez votre profil.',
      benefit2: 'Soyez trouvable par la communauté.',
      benefit3: 'Développez votre réseau sur place.',
      searchTitle: 'Trouver un contact clé en 2 clics',
      searchLead:
        'Recherchez un membre, une entreprise ou un besoin pour développer votre réseau à Guadalajara.',
      searchPlaceholder: 'Rechercher un membre, une entreprise, un besoin…',
      searchButton: 'Chercher maintenant',
      searchTip:
        'Astuce : commencez par un besoin concret (ex. « importateur vin », « expert fiscalité »).',
      columnNewMembersTitle: 'Nouveaux membres cette semaine',
      columnNewMembersLead: 'Découvrez les derniers profils visibles dans l’annuaire.',
      columnNewMembersPlaceholder: 'Bloc nouveaux membres existant',
      columnRequestsTitle: 'Demandes du réseau',
      columnRequestsLead:
        'Publiez ce que vous cherchez : partenaire, zone, produit, expert ou recommandation.',
      columnRequestsCta: 'Poster une demande',
      columnRequestsPlaceholder: 'Bloc demandes du réseau existant',
      columnDirectoryTitle: 'Explorer l’annuaire',
      columnDirectoryLead:
        'Parcourez les entreprises, membres, secteurs et signaux clés du réseau.',
      columnDirectoryPlaceholder: 'Tabs Entreprises / Membres / Secteurs / Radar existants',
      sidebarProfileTitle: 'Créez votre profil maintenant',
      sidebarProfileLead:
        'Apparaissez dans l’annuaire, soyez trouvé plus facilement et accédez aux coordonnées complètes des membres.',
      sidebarProfileCta: 'Rejoindre la communauté',
      sidebarInviteTitle: 'Inviter mon réseau',
      sidebarInviteLead: 'Chaque nouveau profil améliore la valeur du réseau pour tous.',
      sidebarInviteCta: 'Inviter maintenant',
      sectorFallbacksChips:
        'Commerce & Distribution|Conseil & Services aux entreprises|Culture & Loisirs|Énergie & Environnement|Technologies & Informatique',
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
