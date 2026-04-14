/**
 * Step 2 domain layer — canonical types, mappers, and adapters from legacy shapes.
 * Routes and pages stay on `UserProfile` / existing props until they opt into imports from here.
 */

export {
  toCanonicalMember,
  toCanonicalMembers,
  radarMetricsFromLegacyProfiles,
  buildRadarMetricsFromUserProfiles,
  type RadarAggregationOptions,
} from './adapters';

export type {
  Member,
  MemberId,
  ProfileRole,
  ContactPreference,
  MemberContact,
  MemberIdentity,
  MemberNetworkProfile,
} from './member/member.types';

export {
  mapLegacyActivityCategoryToSectorKey,
  mapLegacyPassionIdToHobbyKey,
  mapUserProfileToMember,
} from './member/member.mappers';

export type {
  ContactVisibility,
  InternalOnlyFields,
  VisibilityProjection,
  VisibilitySettings,
} from './member/member.visibility';
export { projectionForViewerRole, projectMemberVisibility } from './member/member.visibility';

export {
  calculateProfileCompletion,
  computeProfileCompletion,
  mapLegacyProfileToMember,
  slugify,
  type LegacyProfileInput,
  type MemberProfileCompletionResult,
  type ProfileCompletionScore,
} from './member/profile-completion';

export type { Company, CompanyLocation, Location } from './company/company.types';

export type {
  HighlightedNeed,
  Need,
  NetworkRequest,
  NetworkRequestId,
  NeedStatus,
} from './need/need.types';

export {
  mapLegacyHighlightedNeedIdToCategoryKey,
  mapLegacyHighlightedNeedIdToNeed,
  mapLegacyMemberRequestToNetworkRequest,
  mapLegacyNeedToCanonical,
} from './need/need.mappers';

export type { CountMetric, RadarMetrics } from './radar/radar.types';
export { aggregateRadarMetrics } from './radar/radar.aggregations';
export { buildRadarMetrics } from './radar/radar.build';

export type { MatchCandidate, MatchReasonCode, MatchScore } from './matching/matching.types';

export { HOBBIES, NEED_CATEGORIES, SECTORS } from './taxonomy/taxonomy.constants';

export type {
  CityKey,
  ClientSizeKey,
  CommunityOpennessKey,
  CompanySizeRangeKey,
  CompanyTypeKey,
  CountryKey,
  HobbyKey,
  LanguageCode,
  LocaleCode,
  NeedCategoryKey,
  ProfessionalStatusKey,
  ProfileRoleKey,
  SectorKey,
  TaxonomyOption,
  VisibilityScope,
} from './taxonomy/taxonomy.types';
