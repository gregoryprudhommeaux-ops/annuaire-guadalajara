import type {
  CityKey,
  ClientSizeKey,
  CommunityOpennessKey,
  CompanySizeRangeKey,
  CompanyTypeKey,
  HobbyKey,
  LanguageCode,
  NeedCategoryKey,
  ProfileRoleKey,
  ProfessionalStatusKey,
  SectorKey,
  TaxonomyOption,
} from './taxonomy.types';

export const WORK_LANGUAGES: TaxonomyOption<LanguageCode>[] = [
  { key: 'fr', label: 'Français' },
  { key: 'es', label: 'Espagnol' },
  { key: 'en', label: 'Anglais' },
  { key: 'pt', label: 'Portugais' },
  { key: 'de', label: 'Allemand' },
  { key: 'it', label: 'Italien' },
  { key: 'zh', label: 'Chinois' },
];

export const SECTORS: TaxonomyOption<SectorKey>[] = [
  { key: 'agriculture_agro', label: 'Agriculture & Agroalimentaire' },
  { key: 'craft_design', label: 'Artisanat & Design' },
  { key: 'automotive_transport', label: 'Automobile & Transport' },
  { key: 'banking_finance', label: 'Banque & Finance' },
  { key: 'construction_real_estate', label: 'Bâtiment & Immobilier' },
  { key: 'commerce_distribution', label: 'Commerce & Distribution' },
  { key: 'consulting_services', label: 'Conseil & Services aux entreprises' },
  { key: 'culture_leisure', label: 'Culture & Loisirs' },
  { key: 'education_training', label: 'Éducation & Formation' },
  { key: 'energy_environment', label: 'Énergie & Environnement' },
  { key: 'hospitality_restaurant', label: 'Hôtellerie & Restauration' },
  { key: 'industry_manufacturing', label: 'Industrie & Manufacturier' },
  { key: 'health_wellbeing', label: 'Santé & Bien-être' },
  { key: 'technology_it', label: 'Technologies & Informatique' },
  { key: 'tourism', label: 'Tourisme' },
  { key: 'other', label: 'Autre' },
];

export const CITIES: TaxonomyOption<CityKey>[] = [
  { key: 'guadalajara', label: 'Guadalajara' },
  { key: 'zapopan', label: 'Zapopan' },
  { key: 'tlaquepaque', label: 'Tlaquepaque' },
  { key: 'tonala', label: 'Tonalá' },
  { key: 'tlajomulco', label: 'Tlajomulco de Zúñiga' },
  { key: 'el_salto', label: 'El Salto' },
  { key: 'other', label: 'Autre' },
];

export const COMPANY_TYPES: TaxonomyOption<CompanyTypeKey>[] = [
  { key: 'startup', label: 'Startup' },
  { key: 'sme', label: 'PME / SME' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'independent', label: 'Indépendant' },
  { key: 'association', label: 'Association' },
  { key: 'non_profit', label: 'Non profit' },
  { key: 'club', label: 'Club' },
];

export const PROFESSIONAL_STATUSES: TaxonomyOption<ProfessionalStatusKey>[] = [
  { key: 'freelance', label: 'Freelance' },
  { key: 'employee', label: 'Salarié' },
  { key: 'founder_executive', label: 'Dirigeant / fondateur' },
  { key: 'volunteer', label: 'Bénévole' },
];

export const COMPANY_SIZE_RANGES: TaxonomyOption<CompanySizeRangeKey>[] = [
  { key: '1_5', label: '1-5' },
  { key: '5_15', label: '5-15' },
  { key: '15_30', label: '15-30' },
  { key: '30_50', label: '30-50' },
  { key: '50_100', label: '50-100' },
  { key: '100_300', label: '100-300' },
  { key: '300_plus', label: '300+' },
  { key: '1000_plus', label: '1000+' },
];

export const PROFILE_ROLES: TaxonomyOption<ProfileRoleKey>[] = [
  { key: 'general_management', label: 'Direction générale' },
  { key: 'strategy_corporate', label: 'Stratégie / Corporate' },
  { key: 'sales_business_dev', label: 'Vente / Business development' },
  { key: 'marketing_communication', label: 'Marketing / Communication' },
  { key: 'customer_success', label: 'Service client / Relation clients' },
  { key: 'product_rd', label: 'Développement produits / R&D' },
  { key: 'production_operations', label: 'Production / Opérations' },
  { key: 'quality_hse', label: 'Qualité / HSE' },
  { key: 'engineering_maintenance', label: 'Technique / Maintenance / Ingénierie' },
  { key: 'logistics_supply_chain', label: 'Logistique / Supply chain' },
  { key: 'procurement_sourcing', label: 'Achats / Approvisionnement' },
  { key: 'finance_accounting_control', label: 'Finance / Comptabilité / Contrôle de gestion' },
  { key: 'human_resources', label: 'Ressources humaines' },
  { key: 'it_digital_si', label: 'Informatique / SI / Digital' },
  { key: 'legal_compliance_risk', label: 'Juridique / Compliance / Risques' },
];

export const NEED_CATEGORIES: TaxonomyOption<NeedCategoryKey>[] = [
  { key: 'new_clients', label: 'Nouveaux clients / comptes finaux', group: 'PARTENAIRES & MARCHÉ' },
  {
    key: 'distributors_resellers_agents',
    label: 'Distributeurs / revendeurs / agents',
    group: 'PARTENAIRES & MARCHÉ',
  },
  {
    key: 'strategic_partners',
    label: 'Partenaires commerciaux / stratégiques',
    group: 'PARTENAIRES & MARCHÉ',
  },
  {
    key: 'suppliers_manufacturers',
    label: 'Fournisseurs / fabricants / sous-traitants',
    group: 'PARTENAIRES & MARCHÉ',
  },
  { key: 'service_providers', label: 'Prestataires de services', group: 'PARTENAIRES & MARCHÉ' },
  { key: 'investors_funding', label: 'Investisseurs / financement', group: 'PARTENAIRES & MARCHÉ' },
  { key: 'legal_support', label: 'Support juridique / conformité', group: 'SUPPORT & EXPERTISE' },
  { key: 'hr_support', label: 'Support RH / recrutement / formation', group: 'SUPPORT & EXPERTISE' },
  { key: 'finance_support', label: 'Support comptable / fiscal / financier', group: 'SUPPORT & EXPERTISE' },
  { key: 'it_support', label: 'Support IT / digital / cybersécurité', group: 'SUPPORT & EXPERTISE' },
  {
    key: 'marketing_support',
    label: 'Support marketing / communication / design',
    group: 'SUPPORT & EXPERTISE',
  },
  {
    key: 'logistics_support',
    label: 'Support logistique / transport / entreposage',
    group: 'SUPPORT & EXPERTISE',
  },
  { key: 'market_intelligence', label: 'Études de marché / veille / data', group: 'INFORMATION & RÉSEAU' },
  { key: 'mentoring_board', label: 'Mentorat / conseil stratégique / board', group: 'INFORMATION & RÉSEAU' },
  { key: 'visibility_pr', label: 'Visibilité / média / RP', group: 'INFORMATION & RÉSEAU' },
  {
    key: 'local_institutions',
    label: 'Partenaires locaux (chambres, clusters…)',
    group: 'INFORMATION & RÉSEAU',
  },
  { key: 'other', label: 'Autre besoin / non précisé', group: 'INFORMATION & RÉSEAU' },
];

export const HOBBIES: TaxonomyOption<HobbyKey>[] = [
  { key: 'golf', label: 'Golf', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'fishing', label: 'Pêche', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'padel', label: 'Padel', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'petanque', label: 'Pétanque', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'hiking', label: 'Randonnée', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'surf', label: 'Surf', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'tennis', label: 'Tennis', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'cycling', label: 'Cyclisme', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'yoga', label: 'Yoga', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'swimming', label: 'Natation', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'diving', label: 'Plongée', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'climbing', label: 'Escalade', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'camping', label: 'Camping', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'travel', label: 'Voyage', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'motorcycle', label: 'Moto', group: 'SPORT, NATURE & AVENTURE' },
  { key: 'cooking', label: 'Cuisine', group: 'GASTRONOMIE' },
  { key: 'wine', label: 'Vins', group: 'GASTRONOMIE' },
  { key: 'gastronomy', label: 'Gastronomie', group: 'GASTRONOMIE' },
  { key: 'mixology', label: 'Mixologie', group: 'GASTRONOMIE' },
  { key: 'pastry', label: 'Pâtisserie', group: 'GASTRONOMIE' },
  { key: 'music', label: 'Musique', group: 'CULTURE & ARTS' },
  { key: 'cinema', label: 'Cinéma', group: 'CULTURE & ARTS' },
  { key: 'literature', label: 'Littérature', group: 'CULTURE & ARTS' },
  { key: 'art', label: 'Art', group: 'CULTURE & ARTS' },
  { key: 'photography', label: 'Photographie', group: 'CULTURE & ARTS' },
  { key: 'theater', label: 'Théâtre', group: 'CULTURE & ARTS' },
  { key: 'startups', label: 'Startups', group: 'TECH & BUSINESS' },
  { key: 'artificial_intelligence', label: 'Intelligence Artificielle', group: 'TECH & BUSINESS' },
  { key: 'investment', label: 'Investissement', group: 'TECH & BUSINESS' },
  { key: 'crypto_web3', label: 'Crypto / Web3', group: 'TECH & BUSINESS' },
  { key: 'ecommerce', label: 'E-commerce', group: 'TECH & BUSINESS' },
];

export const COMMUNITY_OPENNESS: TaxonomyOption<CommunityOpennessKey>[] = [
  { key: 'mentorship', label: 'Mentorat / partage d’expérience' },
  { key: 'speaking', label: 'Interventions / prises de parole' },
  { key: 'event_cocreation', label: 'Co-organisation d’événements' },
  { key: 'event_sponsoring', label: 'Sponsoring d’événements' },
];

export const CLIENT_SIZES: TaxonomyOption<ClientSizeKey>[] = [
  { key: 'independent_micro', label: 'Indépendant / micro-entreprise' },
  { key: 'sme', label: 'PME / SME' },
  { key: 'corporate_enterprise', label: 'Corporate / grands comptes' },
];
