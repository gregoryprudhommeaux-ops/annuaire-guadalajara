import type {
  CityKey,
  ClientSizeKey,
  CompanySizeRangeKey,
  CompanyTypeKey,
  CountryKey,
  ProfileRoleKey,
  SectorKey,
  ProfessionalStatusKey,
} from '../taxonomy/taxonomy.types';

export type CompanyLocation = {
  city: CityKey;
  district?: string;
  state?: string;
  country: CountryKey;
};

export type Company = {
  id: string;
  name: string;
  website?: string;
  sector: SectorKey;
  location: CompanyLocation;
  roleInCompany?: ProfileRoleKey;
  foundedYear?: number;
  employeeRange?: CompanySizeRangeKey;
  companyType?: CompanyTypeKey;
  professionalStatus?: ProfessionalStatusKey;
  typicalClientSizes?: ClientSizeKey[];
  activityDescription?: string;
};

/**
 * Member-level geo (legacy-friendly): free-text + optional coordinates.
 * Distinct from {@link CompanyLocation} which is keyed for analytics/matching.
 */
export type Location = {
  city?: string;
  state?: string;
  neighborhood?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};
