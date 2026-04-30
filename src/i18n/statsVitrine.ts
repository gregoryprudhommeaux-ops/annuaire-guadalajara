/**
 * Chaînes FR / EN / ES pour la vitrine `/stats`.
 * Source unique pour narration commerciale + internationalisation cohérente.
 */
import type { NeedChartRow } from '@/lib/needs';
import type { Language } from '@/types';

export type StatsVitrineCopy = {
  loading: string;
  metaDescription: string;
  metaTitleSuffix: string;
  headerBrand: string;
  headerTitle: string;
  headerLeadPrefix: string;
  headerBridge: string;
  sectorsEyebrow: string;
  sectorsTitle: (distinctCount: number) => string;
  sectorsDescription: string;
  indicatorsEyebrow: string;
  indicatorsTitle: string;
  indicatorsDescription: string;
  sectorCardLabel: string;
  sectorFootnoteUniqueLabels: string;
  sectorPendingTitle: string;
  sectorPendingSub: string;
  viewsLabel: string;
  contactsLabel: string;
  viewsFootnotePublished: string;
  viewsFootnotePending: string;
  contactsFootnotePublished: string;
  contactsFootnotePending: string;
  needsChartTitle: string;
  needsChartSubtitle: string;
  needsChartMembersTooltip: string;
  needsChartEmpty: string;
  footerTagline: string;
  footerSignupHint: string;
  footerDataAsOf: string;
  footerSourceFirestore: string;
  footerSourceComputed: string;
  needCategories: Record<string, string>;
  opportunitySub: Record<string, string>;
  opportunitySubGeneric: string;
  hero: {
    membersLabel: string;
    membersSub: string;
    connectionsLabel: string;
    connectionsSub: string;
    growthLabel: string;
    growthSub: string;
    growthPending: string;
    growthStable: string;
    sectorsLabel: string;
    sectorsSub: string;
    sectorsSoft: string;
    membersZero: string;
    badgeSoon: string;
    badgeInDemand: string;
    badgeGrowing: string;
    badgeStrongMomentum: string;
  };
  networkGrowth: {
    eyebrow: string;
    title: string;
    lead: string;
    annotTitle: string;
    annotSub: string;
    insightTitle: string;
    insightBody: string;
    badge1: (n: number) => string;
    badge2: (n: number) => string;
    tooltipN: (n: number) => string;
    transition: string;
    cta: string;
    empty: string;
  };
  networkEffect: {
    eyebrow: string;
    title: string;
    intro: string;
    badgeMeasured: string;
    badgeProjection: string;
    badgeMarginal: string;
    cardTodayLabel: string;
    cardTodaySub: (pairsFormatted: string) => string;
    cardTomorrowLabel: string;
    cardTomorrowSub: (pairsFormatted: string) => string;
    cardPlusOneDisplay: string;
    cardPlusOneLabel: string;
    cardPlusOneSub: (marginalFormatted: string) => string;
    cardPlusOneSubZero: string;
    profileHeading: string;
    profileBody: string;
    closing: string;
  };
  sharedAffinities: {
    eyebrow: string;
    title: string;
    lead: string;
    whyTitle: string;
    whyBody: string;
    b1: string;
    b2: string;
    b3: string;
    /** Mise en avant : événements qualifiés selon les affinités (colonne droite). */
    eventsHighlight: string;
    ctaLine: string;
    ctaPrimary: string;
    ctaSecondary: string;
    badge0: string;
    badge1: string;
    insightCount: (n: number) => string;
    insightSectors: (n: number) => string;
    insightTop: (names: string) => string;
    cardSubLines: [string, string, string, string];
    emDash: string;
  };
  activeOpportunities: {
    eyebrow: string;
    title: string;
    lead: string;
    whyTitle: string;
    whyBody: string;
    whyB1: string;
    whyB2: string;
    conv: string;
    ctaPrimary: string;
    ctaSecondary: string;
    badgeTop: string;
    badgeSecond: string;
    demandes: (n: number) => string;
    empty: string;
  };
  recentMembers: {
    eyebrow: string;
    title: string;
    lead: string;
    empty: string;
    sectorFallback: string;
  };
  recentRequests: {
    eyebrow: string;
    title: string;
    lead: string;
    leadSecondary: string;
    whyTitle: string;
    whyBody: string;
    b1: string;
    b2: string;
    b3: string;
    ctaLine: string;
    ctaPrimary: string;
    ctaSecondary: string;
    badgeNew: string;
    empty: string;
  };
  segmentedJoin: {
    eyebrow: string;
    title: string;
    lead: string;
    p1: { title: string; body: string; micro: string; cta: string };
    p2: { title: string; body: string; micro: string; cta: string };
    p3: { title: string; body: string; micro: string; cta: string };
    footer: string;
    brandCta: string;
  };
  /** Page publique `/stats/share` (lien à partager, sans menu app). */
  sharePage: {
    documentTitle: string;
    metaDescription: string;
    shareLinkLabel: string;
    shareLinkAria: string;
    closingBenefits: string;
    ctaCreateProfile: string;
    ctaUpdateProfile: string;
  };
};

const FR: StatsVitrineCopy = {
  loading: 'Chargement…',
  metaDescription:
    'Une communauté d’affaires francophone à Guadalajara : croissance, secteurs et besoins exprimés — chiffres agrégés et responsables.',
  metaTitleSuffix: 'Rejoindre FrancoNetwork · Guadalajara',
  headerBrand: 'FrancoNetwork',
  headerTitle: 'Le réseau francophone d’affaires de Guadalajara',
  headerLeadPrefix: 'Découvrez la communauté en chiffres —',
  headerBridge:
    'L’annuaire est déjà actif : la dynamique se construit, et chaque profil qualifié augmente la valeur du réseau pour tous.',
  sectorsEyebrow: 'Secteurs',
  sectorsTitle: (n) =>
    `${n} secteur${n > 1 ? 's' : ''} d’activité · un réseau multi-sectoriel`,
  sectorsDescription:
    'Une diversité sectorielle qui renforce la valeur des mises en relation et la richesse des opportunités à venir.',
  indicatorsEyebrow: 'Indicateurs',
  indicatorsTitle: 'Le réseau en chiffres',
  indicatorsDescription:
    'Indicateurs clés issus de l’annuaire public, actualisés régulièrement.',
  sectorCardLabel: 'Secteurs distincts',
  sectorFootnoteUniqueLabels: 'Libellés d’activité distincts sur les fiches publiées.',
  sectorPendingTitle: 'Cartographie sectorielle à venir',
  sectorPendingSub:
    'Les secteurs distincts seront mis en avant au fil du complément des profils — les données membres nourrissent déjà le graphique ci-dessous.',
  viewsLabel: 'Consultations de profils',
  contactsLabel: 'Mises en relation initiées',
  viewsFootnotePublished: 'Agrégats issus des fiches membres.',
  viewsFootnotePending:
    'Indicateur public en cours d’ouverture. Des signaux d’engagement agrégés pourront apparaître ici.',
  contactsFootnotePublished: 'Totaux agrégés par fiche — données personnelles non exposées.',
  contactsFootnotePending:
    'Indicateur public à venir. Les premiers comptages d’actions agrégées pourront être affichés progressivement.',
  needsChartTitle: 'Besoins déclarés — le réseau en action',
  needsChartSubtitle:
    'Besoins déclarés sur les profils : le réseau travaille déjà ; votre inscription peut répondre à une demande existante.',
  needsChartMembersTooltip: 'Membres',
  needsChartEmpty: 'Aucune donnée de besoins à afficher.',
  footerTagline: 'Réseau francophone d’affaires · Guadalajara, Jalisco, Mexique',
  footerSignupHint: 'Inscription gratuite',
  footerDataAsOf: 'Données au',
  footerSourceFirestore:
    'Source : données agrégées (annuaire), y compris totaux publics lorsqu’ils sont actifs.',
  footerSourceComputed:
    'Source : agrégats annuaire (vues et mises en relation si ces indicateurs sont actifs).',
  needCategories: {
    partners: 'Partenaires commerciaux',
    clients: 'Clients / prospects',
    distributors: 'Distributeurs / importateurs',
    suppliers: 'Fournisseurs',
    talent: 'Talents / recrutement',
    investors: 'Investisseurs / financement',
    experts: 'Experts locaux',
    visibility: 'Visibilité / communication',
    other: 'Autres besoins',
  },
  opportunitySub: {
    partners: 'Des entreprises cherchent déjà des relais business locaux',
    distributors: 'Un besoin fort pour développer la mise sur le marché',
    experts: 'Les membres recherchent des relais de confiance sur place',
    suppliers: 'Le réseau sert aussi à sécuriser l’approvisionnement',
    investors: 'Des besoins ciblés autour du financement et du développement',
    other: 'Des demandes plus transversales émergent aussi',
    clients: 'Recherche de clients et de débouchés qualifiés',
    talent: 'Besoins autour du recrutement et des talents',
    visibility: 'Visibilité, communication et rayonnement',
  },
  opportunitySubGeneric: 'Besoin actif exprimé par des membres du réseau',
  hero: {
    membersLabel: 'Membres dans le réseau',
    membersSub: 'Une communauté qualifiée qui grandit chaque semaine',
    connectionsLabel: 'Connexions potentielles',
    connectionsSub: 'Déjà possibles entre les membres visibles aujourd’hui',
    growthLabel: 'Croissance ce mois',
    growthSub: 'Une dynamique forte portée par les premiers membres actifs',
    growthPending: 'Indicateur en cours d’activation',
    growthStable: 'Rythme régulier ce mois-ci',
    sectorsLabel: 'Secteurs représentés',
    sectorsSub: 'Des passerelles déjà actives entre plusieurs univers métier',
    sectorsSoft: 'Les secteurs apparaîtront au fil de la diversification de l’annuaire',
    membersZero: 'Les premiers membres construisent la communauté',
    badgeSoon: 'Bientôt visible',
    badgeInDemand: 'Déjà recherché',
    badgeGrowing: 'En forte croissance',
    badgeStrongMomentum: 'En forte croissance',
  },
  networkGrowth: {
    eyebrow: 'Croissance du réseau',
    title: 'FrancoNetwork accélère semaine après semaine',
    lead:
      'Une dynamique visible, portée par le bouche-à-oreille, les recommandations et les premiers membres actifs.',
    annotTitle: 'Accélération visible',
    annotSub: 'Le réseau commence à se diffuser naturellement',
    insightTitle: 'Ce que cette courbe raconte',
    insightBody:
      'Les premières inscriptions ne sont pas seulement un volume. Elles montrent qu’un réseau ciblé, francophone et qualifié peut rapidement créer un effet d’entraînement à Guadalajara.',
    badge1: (n) => `+${n} membres sur la période récente`,
    badge2: (n) => `${n} décideurs déjà visibles`,
    tooltipN: (n) => `${n} membres déjà inscrits`,
    transition: 'Chaque nouvelle inscription augmente la valeur du réseau pour tous les autres.',
    cta: 'Rejoindre le réseau',
    empty: 'Pas encore assez d’historique pour la courbe. Revenez bientôt.',
  },
  networkEffect: {
    eyebrow: 'Impact réseau',
    title: 'L’impact de chaque nouveau membre',
    intro:
      'Dans un réseau qualifié, chaque nouvelle inscription ne crée pas seulement un profil de plus. Elle augmente le nombre de connexions possibles, enrichit la diversité du réseau et renforce les opportunités pour tous.',
    badgeMeasured: 'Mesuré aujourd’hui',
    badgeProjection: 'Projection pédagogique',
    badgeMarginal: 'Potentiel illustratif',
    cardTodayLabel: 'Membres aujourd’hui',
    cardTodaySub: (n) => `${n} connexions potentielles déjà visibles`,
    cardTomorrowLabel: 'Membres demain',
    cardTomorrowSub: (n) => `Jusqu’à ${n} connexions potentielles théoriques`,
    cardPlusOneDisplay: '+1',
    cardPlusOneLabel: 'Membre supplémentaire',
    cardPlusOneSub: (n) => `Jusqu’à ${n} nouvelles connexions potentielles dans le réseau actuel`,
    cardPlusOneSubZero:
      'Le premier profil pose les bases ; l’effet « +1 » sur le graphe apparaît à partir du second membre.',
    profileHeading: 'Et avec des profils plus complets ?',
    profileBody:
      'Des profils mieux renseignés rendent la découverte plus précise, renforcent la visibilité des expertises et facilitent les connexions utiles au bon moment.',
    closing:
      'Dans un réseau ciblé, la contribution de chacun peut avoir un impact bien supérieur à sa seule présence.',
  },
  sharedAffinities: {
    eyebrow: 'Affinités du réseau',
    title: 'Les connexions se créent aussi en dehors des rendez-vous',
    lead:
      'Des intérêts communs qui rapprochent des profils issus de secteurs différents et facilitent les premiers échanges.',
    whyTitle: 'Ce que ces affinités révèlent',
    whyBody:
      'Le réseau ne repose pas uniquement sur des cartes de visite. Ces centres d’intérêt communs créent des points d’entrée naturels entre dirigeants, experts et entrepreneurs de secteurs différents.',
    b1: 'Des conversations plus naturelles',
    b2: 'Des passerelles entre secteurs',
    b3: 'Une confiance qui se crée plus vite',
    eventsHighlight:
      'Ces affinités nous permettent aussi d’inviter les membres à des événements qualifiés qui correspondent particulièrement à leurs centres d’intérêt.',
    ctaLine: 'Les meilleures connexions commencent souvent par un terrain commun.',
    ctaPrimary: 'Rejoindre le réseau',
    ctaSecondary: 'Découvrir la communauté',
    badge0: 'Très fédératrice',
    badge1: 'Affinité transversale',
    insightCount: (n) => `${n} affinités déjà visibles dans la communauté`,
    insightSectors: (n) => `Jusqu’à ${n} secteurs réunis autour d’un même intérêt`,
    insightTop: (names) => `Les passions les plus fédératrices : ${names}`,
    cardSubLines: [
      'Crée des points d’entrée naturels entre secteurs',
      'Favorise les échanges informels entre profils variés',
      'Un terrain commun fréquent dans les rencontres du réseau',
      'Rapproche des profils internationaux et mobiles',
    ],
    emDash: '—',
  },
  activeOpportunities: {
    eyebrow: 'Opportunités actives',
    title: 'Ce que les membres recherchent en ce moment',
    lead:
      'Partenaires, distributeurs, experts, fournisseurs : des besoins concrets déjà exprimés dans le réseau.',
    whyTitle: 'Pourquoi c’est utile',
    whyBody:
      'Ces signaux montrent que les membres ne viennent pas seulement pour figurer dans un annuaire. Ils cherchent activement des connexions, des relais terrain et des partenaires capables d’accélérer leurs projets.',
    whyB1: 'Des besoins déjà exprimés par la communauté',
    whyB2: 'Une inscription permet d’apparaître au bon moment',
    conv: 'Vous êtes peut-être précisément le contact que d’autres membres recherchent déjà.',
    ctaPrimary: 'Rejoindre le réseau',
    ctaSecondary: 'Voir les demandes',
    badgeTop: 'Très demandé',
    badgeSecond: 'En forte demande',
    demandes: (n) => `${n} demande${n === 1 ? '' : 's'}`,
    empty: 'Les catégories de besoins s’afficheront dès que des membres les expriment sur leurs profils.',
  },
  recentMembers: {
    eyebrow: 'Activité récente',
    title: 'Ils nous ont rejoints ces derniers jours',
    lead:
      'Des profils variés, des besoins concrets, une dynamique visible. De nouveaux profils rejoignent le réseau avec des besoins précis, ce qui renforce chaque semaine la valeur de l’annuaire pour les membres déjà présents.',
    empty: 'Les premiers membres construisent actuellement la base du réseau.',
    sectorFallback: 'Activité professionnelle',
  },
  recentRequests: {
    eyebrow: 'Demandes récentes',
    title: 'Des besoins publiés récemment dans le réseau',
    lead: 'Des recherches concrètes, déjà exprimées par les membres ces derniers jours.',
    leadSecondary:
      'Les demandes détaillées publiées dans le flux s’enrichiront au fil de la croissance, mais les besoins concrets sont déjà visibles dans les catégories d’opportunités actives du réseau.',
    whyTitle: 'Pourquoi c’est important',
    whyBody:
      'Ces demandes montrent qu’au-delà de la visibilité, les membres utilisent déjà le réseau pour trouver des relais concrets, des expertises ciblées et des partenaires de confiance.',
    b1: 'Des besoins réellement exprimés',
    b2: 'Des opportunités déjà actives',
    b3: 'Une communauté qui passe à l’action',
    ctaLine: 'Votre profil peut répondre à une demande déjà présente dans le réseau.',
    ctaPrimary: 'Rejoindre le réseau',
    ctaSecondary: 'Voir les demandes',
    badgeNew: 'Nouveau',
    empty: 'Les premières demandes actives apparaîtront ici au fil de la croissance du réseau.',
  },
  segmentedJoin: {
    eyebrow: 'Passer à l’action',
    title: 'Le réseau devient utile dès que le bon profil entre au bon moment',
    lead: 'Choisissez l’entrée qui correspond le mieux à votre situation actuelle.',
    p1: {
      title: 'Vous développez votre activité au Mexique',
      body:
        'Accédez à des contacts qualifiés, gagnez du temps sur le terrain et identifiez plus vite les bons relais locaux.',
      micro: 'Pensé pour les échanges business francophones à Guadalajara',
      cta: 'Rejoindre comme entreprise',
    },
    p2: {
      title: 'Vous cherchez des partenaires commerciaux',
      body:
        'Distributeurs, apporteurs d’affaires, experts locaux, fournisseurs : le réseau vous aide à transformer vos recherches en connexions utiles.',
      micro: 'Des connexions plus ciblées qu’un annuaire classique',
      cta: 'Voir les opportunités',
    },
    p3: {
      title: 'Vous êtes déjà implanté et souhaitez gagner en visibilité',
      body:
        'Positionnez votre profil au bon moment pour apparaître dans les recherches et les demandes exprimées par la communauté.',
      micro: 'Une présence visible au sein d’une communauté qualifiée',
      cta: 'Créer ma présence dans le réseau',
    },
    footer:
      'Plus le réseau attire de profils pertinents, plus chaque inscription crée de la valeur pour les autres.',
    brandCta: 'Rejoindre FrancoNetwork',
  },
  sharePage: {
    documentTitle: 'FrancoNetwork — Communauté en chiffres',
    metaDescription:
      'Chiffres agrégés du réseau francophone d’affaires à Guadalajara : membres, secteurs, besoins — à partager librement.',
    shareLinkLabel: 'Partager',
    shareLinkAria: 'Ouvrir la page publique à partager dans un nouvel onglet',
    closingBenefits:
      'Profitez des opportunités d’affaires concrètes, soyez invité à des rencontres B2B qualifiées selon votre profil, faites connaître vos besoins et trouvez des partenaires, prestataires ou clients.',
    ctaCreateProfile: 'Créer votre profil',
    ctaUpdateProfile: 'Mettre à jour votre profil',
  },
};

const EN: StatsVitrineCopy = {
  loading: 'Loading…',
  metaDescription:
    'A qualified Francophone business community in Guadalajara: growth, sectors represented, and needs expressed — aggregated, privacy-safe figures.',
  metaTitleSuffix: 'Join FrancoNetwork · Francophone business · Guadalajara',
  headerBrand: 'FrancoNetwork',
  headerTitle: 'The French-speaking business network of Guadalajara',
  headerLeadPrefix: 'Discover the community in numbers —',
  headerBridge:
    'The directory is already live: momentum is building, and each qualified profile raises the value of the network for everyone else.',
  sectorsEyebrow: 'Sectors',
  sectorsTitle: (n) => `${n} business sector${n === 1 ? '' : 's'} · a multi-sector network`,
  sectorsDescription:
    'Sector diversity strengthens introductions and expands the opportunity surface ahead.',
  indicatorsEyebrow: 'Indicators',
  indicatorsTitle: 'The network in numbers',
  indicatorsDescription: 'Key indicators from the public directory, refreshed regularly.',
  sectorCardLabel: 'Distinct sectors',
  sectorFootnoteUniqueLabels: 'Unique activity labels across published profiles.',
  sectorPendingTitle: 'Sector map opening next',
  sectorPendingSub:
    'Distinct sectors will surface as profiles stay complete — underlying membership data already informs the chart below.',
  viewsLabel: 'Profile views',
  contactsLabel: 'Introductions & contact actions initiated',
  viewsFootnotePublished: 'Aggregated counters on member profiles.',
  viewsFootnotePending:
    'Public indicator rolling out. Aggregated engagement signals may appear here.',
  contactsFootnotePublished: 'Privacy-safe actions summed at profile level.',
  contactsFootnotePending:
    'Public indicator coming soon. Aggregated action counts may appear progressively.',
  needsChartTitle: 'Declared needs — the network at work',
  needsChartSubtitle:
    'Needs declared on profiles — proof the directory is already working; your signup may answer an existing signal.',
  needsChartMembersTooltip: 'Members',
  needsChartEmpty: 'No need data to display yet.',
  footerTagline: 'Francophone business network · Guadalajara, Jalisco, Mexico',
  footerSignupHint: 'Free signup',
  footerDataAsOf: 'Data as of',
  footerSourceFirestore:
    'Source: aggregated directory data, including public showcase totals when published.',
  footerSourceComputed:
    'Source: aggregated directory data (views and contact actions when those metrics are active).',
  needCategories: {
    partners: 'Business partners',
    clients: 'Clients / prospects',
    distributors: 'Distributors / importers',
    suppliers: 'Suppliers',
    talent: 'Talent / hiring',
    investors: 'Investors / funding',
    experts: 'Local experts',
    visibility: 'Visibility / communications',
    other: 'Other needs',
  },
  opportunitySub: {
    partners: 'Companies are already looking for local business relays',
    distributors: 'Strong demand to grow go-to-market reach',
    experts: 'Members look for trusted on-the-ground contacts',
    suppliers: 'The network also helps secure supply',
    investors: 'Targeted needs around funding and growth',
    other: 'Broader, cross-cutting needs are emerging too',
    clients: 'Looking for clients and qualified opportunities',
    talent: 'Needs around hiring and talent',
    visibility: 'Visibility, communication, and reach',
  },
  opportunitySubGeneric: 'Active need expressed by network members',
  hero: {
    membersLabel: 'Members in the network',
    membersSub: 'A qualified community that grows every week',
    connectionsLabel: 'Potential connections',
    connectionsSub: 'Already possible among members visible today',
    growthLabel: 'Growth this month',
    growthSub: 'Strong momentum driven by early active members',
    growthPending: 'Indicator activating',
    growthStable: 'Steady pace this month',
    sectorsLabel: 'Sectors represented',
    sectorsSub: 'Bridges already active between several business worlds',
    sectorsSoft: 'Sectors will show as the directory diversifies',
    membersZero: 'The first members are building the community',
    badgeSoon: 'Coming into view',
    badgeInDemand: 'In demand',
    badgeGrowing: 'Growing',
    badgeStrongMomentum: 'Strong momentum',
  },
  networkGrowth: {
    eyebrow: 'Network growth',
    title: 'FrancoNetwork accelerates week after week',
    lead:
      'Visible momentum powered by word of mouth, referrals, and early active members.',
    annotTitle: 'Visible acceleration',
    annotSub: 'The network is starting to spread naturally',
    insightTitle: 'What this curve tells you',
    insightBody:
      'Early sign-ups are not just volume. They show that a focused, Francophone, qualified network can quickly create pull in Guadalajara.',
    badge1: (n) => `+${n} members over the recent period`,
    badge2: (n) => `${n} decision-makers already listed`,
    tooltipN: (n) => `${n} members already signed up`,
    transition: 'Each new sign-up increases the value of the network for everyone else.',
    cta: 'Join the network',
    empty: 'Not enough history yet to plot the curve. Check back soon.',
  },
  networkEffect: {
    eyebrow: 'Network impact',
    title: 'The impact of each new member',
    intro:
      'In a qualified network, each new signup is more than another profile — it expands possible connections, deepens diversity, and strengthens opportunities for everyone.',
    badgeMeasured: 'Measured today',
    badgeProjection: 'Educational projection',
    badgeMarginal: 'Illustrative potential',
    cardTodayLabel: 'Members today',
    cardTodaySub: (n) => `${n} potential connections already visible`,
    cardTomorrowLabel: 'Members tomorrow',
    cardTomorrowSub: (n) => `Up to ${n} theoretical potential connections`,
    cardPlusOneDisplay: '+1',
    cardPlusOneLabel: 'One additional member',
    cardPlusOneSub: (n) => `Up to ${n} new potential connections in the current network`,
    cardPlusOneSubZero:
      'The first profile lays the groundwork; additive “+1” effects in the graph start from the second member onward.',
    profileHeading: 'And with richer profiles?',
    profileBody:
      'Better-filled profiles make discovery more precise, give expertise more visibility, and help useful connections happen at the right time.',
    closing:
      'In a focused network, each person’s contribution can matter far beyond simply being present.',
  },
  sharedAffinities: {
    eyebrow: 'Network affinities',
    title: 'Connections also happen beyond formal meetings',
    lead:
      'Shared interests bring profiles from different sectors closer and make first exchanges easier.',
    whyTitle: 'What these affinities reveal',
    whyBody:
      'The network is not only about business cards. Shared interests create natural entry points between leaders, experts, and entrepreneurs from different fields.',
    b1: 'More natural conversations',
    b2: 'Bridges between sectors',
    b3: 'Trust that builds faster',
    eventsHighlight:
      'These affinities also help us invite members to curated, qualified events that match their interests particularly well.',
    ctaLine: 'The strongest connections often start with common ground.',
    ctaPrimary: 'Join the network',
    ctaSecondary: 'Discover the community',
    badge0: 'Highly unifying',
    badge1: 'Cross-cutting affinity',
    insightCount: (n) => `${n} affinities already visible in the community`,
    insightSectors: (n) => `Up to ${n} sectors around a single interest`,
    insightTop: (names) => `Most unifying interests: ${names}`,
    cardSubLines: [
      'Creates natural entry points across sectors',
      'Supports informal exchanges between varied profiles',
      'A frequent common ground in network meetups',
      'Brings together international, mobile profiles',
    ],
    emDash: '—',
  },
  activeOpportunities: {
    eyebrow: 'Active opportunities',
    title: 'What members are looking for right now',
    lead:
      'Partners, distributors, experts, suppliers — concrete needs already expressed in the network.',
    whyTitle: 'Why this matters',
    whyBody:
      'These signals show members are not here only to be listed. They actively seek connections, on-the-ground relays, and partners who can accelerate their projects.',
    whyB1: 'Needs already expressed by the community',
    whyB2: 'Joining helps you appear at the right moment',
    conv: 'You may be exactly the contact other members are already looking for.',
    ctaPrimary: 'Join the network',
    ctaSecondary: 'View requests',
    badgeTop: 'High demand',
    badgeSecond: 'Strong demand',
    demandes: (n) => `${n} request${n === 1 ? '' : 's'}`,
    empty: 'Need categories will appear here as members express them.',
  },
  recentMembers: {
    eyebrow: 'Recent activity',
    title: 'They joined us in recent days',
    lead:
      'Varied profiles, concrete needs, visible momentum. New members arrive with precise needs — strengthening directory value every week for those already inside.',
    empty: 'The first members are building the network’s foundation.',
    sectorFallback: 'Professional activity',
  },
  recentRequests: {
    eyebrow: 'Recent requests',
    title: 'Needs recently published in the network',
    lead: 'Concrete searches already expressed by members in recent days.',
    leadSecondary:
      'Detailed items in this feed will grow over time — meanwhile concrete demand is already visible in active opportunity categories.',
    whyTitle: 'Why this matters',
    whyBody:
      'Beyond visibility, members already use the network to find concrete relays, focused expertise, and trusted partners.',
    b1: 'Genuinely expressed needs',
    b2: 'Already active opportunities',
    b3: 'A community that takes action',
    ctaLine: 'Your profile could address a need already in the network.',
    ctaPrimary: 'Join the network',
    ctaSecondary: 'View requests',
    badgeNew: 'New',
    empty: 'The first active requests will appear here as the network grows.',
  },
  segmentedJoin: {
    eyebrow: 'Take action',
    title: 'The network becomes useful when the right profile joins at the right time',
    lead: 'Choose the entry that best fits your situation today.',
    p1: {
      title: 'You are growing your business in Mexico',
      body:
        'Access qualified contacts, move faster on the ground, and spot the right local relays earlier.',
      micro: 'Built for French-speaking business exchanges in Guadalajara',
      cta: 'Join as a business',
    },
    p2: {
      title: 'You are looking for commercial partners',
      body:
        'Distributors, deal-bringers, local experts, suppliers: turn your searches into useful connections.',
      micro: 'More targeted than a simple directory',
      cta: 'View opportunities',
    },
    p3: {
      title: 'You are already established and want more visibility',
      body:
        'Position your profile so you show up in searches and in requests from the community.',
      micro: 'Visible in a qualified community',
      cta: 'Build my presence in the network',
    },
    footer:
      'The more relevant profiles join, the more value each new sign-up creates for others.',
    brandCta: 'Join FrancoNetwork',
  },
  sharePage: {
    documentTitle: 'FrancoNetwork — Community in numbers',
    metaDescription:
      'Aggregated figures from the Francophone business network in Guadalajara — free to share.',
    shareLinkLabel: 'Share',
    shareLinkAria: 'Open the public share page in a new tab',
    closingBenefits:
      'Access concrete business opportunities, get invited to qualified B2B meetings matched to your profile, publish your needs, and find partners, providers, or clients.',
    ctaCreateProfile: 'Create your profile',
    ctaUpdateProfile: 'Update your profile',
  },
};

const ES: StatsVitrineCopy = {
  loading: 'Cargando…',
  metaDescription:
    'Comunidad francófona cualificada en Guadalajara: crecimiento, sectores y necesidades expresadas — cifras agregadas y responsables.',
  metaTitleSuffix: 'Únase a FrancoNetwork · negocios francófonos · Guadalajara',
  headerBrand: 'FrancoNetwork',
  headerTitle: 'La red francófona de negocios de Guadalajara',
  headerLeadPrefix: 'Descubra la comunidad en cifras —',
  headerBridge:
    'El directorio ya está activo: la dinámica crece, y cada perfil cualificado suma valor para el conjunto de la red.',
  sectorsEyebrow: 'Sectores',
  sectorsTitle: (n) =>
    `${n} sector${n === 1 ? '' : 'es'} de actividad · una red multisectorial`,
  sectorsDescription:
    'La diversidad sectorial refuerza el valor de las conexiones y la riqueza de las oportunidades por venir.',
  indicatorsEyebrow: 'Indicadores',
  indicatorsTitle: 'La red en cifras',
  indicatorsDescription: 'Indicadores clave del directorio público, actualizados con regularidad.',
  sectorCardLabel: 'Sectores distintos',
  sectorFootnoteUniqueLabels: 'Etiquetas de actividad únicas en perfiles publicados.',
  sectorPendingTitle: 'Mapa sectorial en apertura',
  sectorPendingSub:
    'Los sectores distintos aparecerán al completarse los perfiles — los datos de membros ya alimentan el gráfico inferior.',
  viewsLabel: 'Consultas de perfil',
  contactsLabel: 'Contactos e iniciativas de relación',
  viewsFootnotePublished: 'Contadores agregados en fichas de miembros.',
  viewsFootnotePending:
    'Indicador público en despliegue. Aquí podrán aparecer señales agregadas de interacción.',
  contactsFootnotePublished: 'Acciones agregadas por miembro, sin datos sensibles.',
  contactsFootnotePending:
    'Indicador público próximo. Los primeros recuentos de acciones agregadas podrán mostrarse gradualmente.',
  needsChartTitle: 'Necesidades declaradas — la red en acción',
  needsChartSubtitle:
    'Necesidades declaradas en perfiles — la red ya trabaja; su alta puede responder a una señal existente.',
  needsChartMembersTooltip: 'Miembros',
  needsChartEmpty: 'No hay datos de necesidades para mostrar.',
  footerTagline: 'Red de negocios francófona · Guadalajara, Jalisco, México',
  footerSignupHint: 'Inscripción gratuita',
  footerDataAsOf: 'Datos al',
  footerSourceFirestore:
    'Fuente: datos agregados del directorio, incluidos totales públicos cuando están publicados.',
  footerSourceComputed:
    'Fuente: datos agregados (vistas y acciones de contacto cuando esos indicadores existen).',
  needCategories: {
    partners: 'Socios comerciales',
    clients: 'Clientes / prospectos',
    distributors: 'Distribuidores / importadores',
    suppliers: 'Proveedores',
    talent: 'Talento / reclutamiento',
    investors: 'Inversores / financiación',
    experts: 'Expertos locales',
    visibility: 'Visibilidad / comunicación',
    other: 'Otras necesidades',
  },
  opportunitySub: {
    partners: 'Empresas que ya buscan relés comerciales locales',
    distributors: 'Demanda fuerte para impulsar la puesta en el mercado',
    experts: 'Los miembros buscan contactos de confianza en el territorio',
    suppliers: 'La red también ayuda a asegurar el abastecimiento',
    investors: 'Necesidades concretas de financiamiento y crecimiento',
    other: 'También surgen necesidades más transversales',
    clients: 'Búsqueda de clientes y oportunidades cualificadas',
    talent: 'Necesidades de talento y reclutamiento',
    visibility: 'Visibilidad, comunicación y proyección',
  },
  opportunitySubGeneric: 'Necesidad activa expresada por miembros de la red',
  hero: {
    membersLabel: 'Miembros en la red',
    membersSub: 'Una comunidad cualificada que crece cada semana',
    connectionsLabel: 'Conexiones potenciales',
    connectionsSub: 'Ya posibles entre los miembros visibles hoy',
    growthLabel: 'Crecimiento este mes',
    growthSub: 'Una dinámica fuerte impulsada por los primeros miembros activos',
    growthPending: 'Indicador en activación',
    growthStable: 'Ritmo estable este mes',
    sectorsLabel: 'Sectores representados',
    sectorsSub: 'Pasarelas ya activas entre varios universos profesionales',
    sectorsSoft: 'Los sectores aparecerán conforme se diversifica el directorio',
    membersZero: 'Los primeros miembros construyen la comunidad',
    badgeSoon: 'Pronto visible',
    badgeInDemand: 'Ya buscado',
    badgeGrowing: 'En crecimiento',
    badgeStrongMomentum: 'En dinámica',
  },
  networkGrowth: {
    eyebrow: 'Crecimiento de la red',
    title: 'FrancoNetwork acelera semana tras semana',
    lead:
      'Una dinámica visible impulsada por el boca a boca, las recomendaciones y los primeros miembros activos.',
    annotTitle: 'Aceleración visible',
    annotSub: 'La red empieza a difundirse de forma natural',
    insightTitle: 'Qué cuenta esta curva',
    insightBody:
      'Las primeras inscripciones no son solo volumen. Muestran que una red francófona, cualificada y enfocada puede generar rápidamente efecto de arrastre en Guadalajara.',
    badge1: (n) => `+${n} miembros en el periodo reciente`,
    badge2: (n) => `${n} decisores ya visibles`,
    tooltipN: (n) => `Ya ${n} miembros inscritos`,
    transition: 'Cada nueva inscripción hace crecer el valor de la red para todos los demás.',
    cta: 'Unirse a la red',
    empty: 'Aún no hay historial suficiente para la curva. Vuelva pronto.',
  },
  networkEffect: {
    eyebrow: 'Impacto de la red',
    title: 'El impacto de cada nuevo miembro',
    intro:
      'En una red cualificada, cada nueva inscripción no es solo un perfil más: amplía las conexiones posibles, enriquece la diversidad y refuerza las oportunidades para todos.',
    badgeMeasured: 'Medido hoy',
    badgeProjection: 'Proyección pedagógica',
    badgeMarginal: 'Potencial ilustrativo',
    cardTodayLabel: 'Miembros hoy',
    cardTodaySub: (n) => `${n} conexiones potenciales ya visibles entre los miembros publicados`,
    cardTomorrowLabel: 'Miembros mañana',
    cardTomorrowSub: (n) => `Hasta ${n} conexiones potenciales teóricas`,
    cardPlusOneDisplay: '+1',
    cardPlusOneLabel: 'Un miembro adicional',
    cardPlusOneSub: (n) => `Hasta ${n} nuevas conexiones potenciales en la red actual`,
    cardPlusOneSubZero:
      'El primer perfil sienta la base; los efectos “+1” en el grafo empiezan con el segundo miembro.',
    profileHeading: '¿Y con perfiles más completos?',
    profileBody:
      'Perfiles mejor informados hacen el descubrimiento más preciso, dan más visibilidad a las expertises y facilitan conexiones útiles en el momento adecuado.',
    closing:
      'En una red enfocada, la aportación de cada uno puede tener un impacto muy superior a su sola presencia.',
  },
  sharedAffinities: {
    eyebrow: 'Afinidades de la red',
    title: 'Las conexiones también nacen fuera de las reuniones',
    lead:
      'Intereses comunes que acercan perfiles de sectores distintos y facilitan los primeros intercambios.',
    whyTitle: 'Qué revelan estas afinidades',
    whyBody:
      'La red no se basa solo en tarjetas. Los intereses compartidos crean puntos de encuentro naturales entre directivos, expertos y emprendedores de distintos ámbitos.',
    b1: 'Conversaciones más naturales',
    b2: 'Puentes entre sectores',
    b3: 'Una confianza que se construye más rápido',
    eventsHighlight:
      'Estas afinidades también nos permiten invitar a los miembros a eventos cualificados que encajan especialmente con sus intereses.',
    ctaLine: 'Las mejores conexiones a menudo empiezan con un terreno común.',
    ctaPrimary: 'Unirse a la red',
    ctaSecondary: 'Descubrir la comunidad',
    badge0: 'Muy unificadora',
    badge1: 'Afinidad transversal',
    insightCount: (n) => `${n} afinidades ya visibles en la comunidad`,
    insightSectors: (n) => `Hasta ${n} sectores alrededor de un mismo interés`,
    insightTop: (names) => `Intereses que más unen: ${names}`,
    cardSubLines: [
      'Crea puntos de entrada naturales entre sectores',
      'Favorece el intercambio informal entre perfiles variados',
      'Un terreno común frecuente en los encuentros de la red',
      'Acerca perfiles internacionales y móviles',
    ],
    emDash: '—',
  },
  activeOpportunities: {
    eyebrow: 'Oportunidades activas',
    title: 'Lo que los miembros buscan en este momento',
    lead:
      'Socios, distribuidores, expertos, proveedores: necesidades concretas ya expresadas en la red.',
    whyTitle: 'Para qué sirve',
    whyBody:
      'Estas señales muestran que los miembros no vienen solo a figurar. Buscan conexiones activas, apoyo local y socios capaces de acelerar sus proyectos.',
    whyB1: 'Necesidades ya expresadas por la comunidad',
    whyB2: 'Inscribirse ayuda a aparecer en el momento adecuado',
    conv: 'Quizá usted es justo el contacto que otros miembros ya buscan.',
    ctaPrimary: 'Unirse a la red',
    ctaSecondary: 'Ver solicitudes',
    badgeTop: 'Muy demandado',
    badgeSecond: 'En fuerte demanda',
    demandes: (n) => `${n} solicitud${n === 1 ? '' : 'es'}`,
    empty: 'Las categorías aparecerán cuando los miembros expresen sus necesidades.',
  },
  recentMembers: {
    eyebrow: 'Actividad reciente',
    title: 'Se unieron en los últimos días',
    lead:
      'Perfiles variados, necesidades concretas, dinámica visible. Nuevos perfiles llegan con necesidades precisas — reforzando cada semana el valor del directorio para quienes ya están dentro.',
    empty: 'Los primeros miembros están construyendo la base de la red.',
    sectorFallback: 'Actividad profesional',
  },
  recentRequests: {
    eyebrow: 'Solicitudes recientes',
    title: 'Necesidades publicadas recientemente en la red',
    lead: 'Búsquedas concretas ya expresadas por los miembros en los últimos días.',
    leadSecondary:
      'Las solicitudes detalladas en este flujo crecerán con el tiempo — mientras tanto, la demanda concreta ya es visible en las categorías de oportunidades activas.',
    whyTitle: 'Para qué sirve',
    whyBody:
      'Estas señales muestran que, además de visibilidad, la red ya se usa para relés concretos, pericia focalizada y socios de confianza.',
    b1: 'Necesidades realmente expresadas',
    b2: 'Oportunidades ya activas',
    b3: 'Una comunidad en acción',
    ctaLine: 'Su perfil podría responder a una solicitud que ya circula en la red.',
    ctaPrimary: 'Unirse a la red',
    ctaSecondary: 'Ver solicitudes',
    badgeNew: 'Nuevo',
    empty: 'Las primeras demandas activas irán apareciendo aquí con el crecimiento de la red.',
  },
  segmentedJoin: {
    eyebrow: 'Pase a la acción',
    title: 'La red se vuelve útil cuando el perfil adecuado entra en el momento adecuado',
    lead: 'Elija la entrada que mejor encaje con su situación actual.',
    p1: {
      title: 'Desarrolla su actividad en México',
      body:
        'Acceda a contactos cualificados, gane tiempo sobre el terreno e identifique antes a los buenos apoyos locales.',
      micro: 'Pensado para el intercambio de negocio francófono en Guadalajara',
      cta: 'Unirse como empresa',
    },
    p2: {
      title: 'Busca socios comerciales',
      body:
        'Distribuidores, generadores de oportunidades, expertos locales, proveedores: de la búsqueda a la conexión útil.',
      micro: 'Más orientado que un anuario clásico',
      cta: 'Ver oportunidades',
    },
    p3: {
      title: 'Ya está implantado y quiere más visibilidad',
      body:
        'Posicione su perfil en el buen momento para figurar en las búsquedas y en las demandas de la comunidad.',
      micro: 'Presencia visible en una comunidad cualificada',
      cta: 'Crear mi presencia en la red',
    },
    footer:
      'Cuanto más perfiles relevantes atrae la red, más valor aporta cada alta para los demás.',
    brandCta: 'Unirse a FrancoNetwork',
  },
  sharePage: {
    documentTitle: 'FrancoNetwork — La comunidad en cifras',
    metaDescription:
      'Cifras agregadas de la red francófona de negocios en Guadalajara — para compartir libremente.',
    shareLinkLabel: 'Compartir',
    shareLinkAria: 'Abrir la página pública para compartir en una nueva pestaña',
    closingBenefits:
      'Aproveche oportunidades de negocio concretas, sea invitado a encuentros B2B cualificados según su perfil, transmita sus necesidades y encuentre socios, proveedores o clientes.',
    ctaCreateProfile: 'Crear su perfil',
    ctaUpdateProfile: 'Actualizar su perfil',
  },
};

export function getStatsVitrineCopy(lang: Language): StatsVitrineCopy {
  if (lang === 'en') return EN;
  if (lang === 'es') return ES;
  return FR;
}

export function translateNeedChartRows(lang: Language, rows: NeedChartRow[]): NeedChartRow[] {
  const cat = getStatsVitrineCopy(lang).needCategories;
  return rows.map((r) => ({
    ...r,
    label: cat[r.key] ?? r.label,
  }));
}
