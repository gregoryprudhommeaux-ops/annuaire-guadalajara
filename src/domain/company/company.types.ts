import type { EmployeeCountRange } from '../../types';

export type CompanyId = string;

export type CompanyType =
  | 'startup'
  | 'pme'
  | 'corporate'
  | 'independent'
  | 'association'
  | 'nonprofit'
  | 'club'
  | 'unknown';

export type ProfessionalStatus = 'freelance' | 'employee' | 'owner' | 'volunteer' | 'unknown';

export type CompanySizeRange = EmployeeCountRange | 'unknown';

export type Location = {
  city?: string;
  state?: string;
  neighborhood?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export type Company = {
  id: CompanyId;
  name: string;
  sectorId?: string;
  website?: string;
  positionCategory?: string;
  createdYear?: number;
  employeeCount?: CompanySizeRange;
  location?: Location;
  companyType?: CompanyType;
  professionalStatus?: ProfessionalStatus;
  typicalClientSizes?: ('independant' | 'pme' | 'corporate' | 'mixte')[];
  activityDescription?: string;
};

