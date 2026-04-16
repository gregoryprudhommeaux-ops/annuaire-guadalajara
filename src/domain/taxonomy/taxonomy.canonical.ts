/**
 * Canonical taxonomy keys (STEP 2 domain layer).
 *
 * These are **stable product keys** for typing, matching, and admin analytics.
 * They are intentionally separate from legacy Firestore string values
 * (e.g. passion ids like `peche`, need codes like `NEED_CLIENTS`).
 *
 * Use explicit mappers when bridging legacy → canonical (do not rewrite UI).
 */

export type LocaleCode = 'fr' | 'es' | 'en';

export type LanguageCode =
  | 'fr'
  | 'es'
  | 'en'
  | 'pt'
  | 'de'
  | 'it'
  | 'zh';

export type SectorKey =
  | 'agriculture_agro'
  | 'craft_design'
  | 'automotive_transport'
  | 'banking_finance'
  | 'construction_real_estate'
  | 'commerce_distribution'
  | 'consulting_services'
  | 'culture_leisure'
  | 'education_training'
  | 'energy_environment'
  | 'hospitality_restaurant'
  | 'industry_manufacturing'
  | 'health_wellbeing'
  | 'technology_it'
  | 'tourism'
  | 'other';

export type CompanyTypeKey =
  | 'startup'
  | 'sme'
  | 'corporate'
  | 'independent'
  | 'association'
  | 'non_profit'
  | 'club';

export type ProfessionalStatusKey =
  | 'freelance'
  | 'employee'
  | 'founder_executive'
  | 'volunteer';

export type CompanySizeRangeKey =
  | '1_5'
  | '5_15'
  | '15_30'
  | '30_50'
  | '50_100'
  | '100_300'
  | '300_plus'
  | '1000_plus';

export type ProfileRoleKey =
  | 'general_management'
  | 'strategy_corporate'
  | 'sales_business_dev'
  | 'marketing_communication'
  | 'customer_success'
  | 'product_rd'
  | 'production_operations'
  | 'quality_hse'
  | 'engineering_maintenance'
  | 'logistics_supply_chain'
  | 'procurement_sourcing'
  | 'finance_accounting_control'
  | 'human_resources'
  | 'it_digital_si'
  | 'legal_compliance_risk';

export type NeedCategoryKey =
  | 'distributors_resellers_agents'
  | 'strategic_partners'
  | 'suppliers_manufacturers'
  | 'service_providers'
  | 'investors_funding'
  | 'legal_support'
  | 'hr_support'
  | 'finance_support'
  | 'it_support'
  | 'marketing_support'
  | 'logistics_support'
  | 'market_intelligence'
  | 'mentoring_board'
  | 'visibility_pr'
  | 'local_institutions'
  | 'other';

export type HobbyCategoryKey =
  | 'sport_nature_adventure'
  | 'gastronomy'
  | 'culture_arts'
  | 'tech_business';

export type HobbyKey =
  | 'golf'
  | 'fishing'
  | 'padel'
  | 'petanque'
  | 'hiking'
  | 'surf'
  | 'tennis'
  | 'cycling'
  | 'yoga'
  | 'meditation'
  | 'football'
  | 'rugby'
  | 'baseball'
  | 'swimming'
  | 'diving'
  | 'climbing'
  | 'camping'
  | 'travel'
  | 'motorcycle'
  | 'cooking'
  | 'wine'
  | 'gastronomy'
  | 'mixology'
  | 'pastry'
  | 'video_games'
  | 'poker'
  | 'tarot'
  | 'bridge'
  | 'music'
  | 'cinema'
  | 'literature'
  | 'art'
  | 'photography'
  | 'theater'
  | 'startups'
  | 'artificial_intelligence'
  | 'investment'
  | 'crypto_web3'
  | 'ecommerce';

export type CommunityOpennessKey =
  | 'mentorship'
  | 'speaking'
  | 'event_cocreation'
  | 'event_sponsoring';

export type ClientSizeKey = 'independent_micro' | 'sme' | 'corporate_enterprise';

export type VisibilityScope = 'public' | 'members' | 'private';

export type CityKey =
  | 'guadalajara'
  | 'zapopan'
  | 'tlaquepaque'
  | 'tonala'
  | 'tlajomulco'
  | 'el_salto'
  | 'other';

export type CountryKey = string;

export type TaxonomyOption<T extends string> = {
  key: T;
  label: string;
  group?: string;
};
