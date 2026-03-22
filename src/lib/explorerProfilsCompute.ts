import type { Language } from '../types';
import { explorerProfilsT } from '../copy/explorerProfilsI18n';

export type CompanySize = 'freelance' | 'pme' | 'corporate';

export type ExplorerMember = {
  id: string;
  name: string;
  sector: string;
  city: string;
  country: string;
  languages: string[];
  companySize: CompanySize;
  exportOrientation: number;
  eventsAppetite: number;
  networkingNeeds: number;
  digitalMaturity: number;
  teamSizeScore: number;
  exchangeFrequency: number;
  tags: string[];
};

export type RadarAxis =
  | 'exportOrientation'
  | 'eventsAppetite'
  | 'networkingNeeds'
  | 'digitalMaturity'
  | 'teamSizeScore'
  | 'exchangeFrequency';

export type RadarDatum = {
  axis: RadarAxis;
  label: string;
  community: number;
  freelance?: number;
  pme?: number;
  corporate?: number;
};

const RADAR_AXES: RadarAxis[] = [
  'exportOrientation',
  'eventsAppetite',
  'networkingNeeds',
  'digitalMaturity',
  'teamSizeScore',
  'exchangeFrequency',
];

const AXIS_I18N_KEY: Record<RadarAxis, string> = {
  exportOrientation: 'radarAxisExport',
  eventsAppetite: 'radarAxisEvents',
  networkingNeeds: 'radarAxisNetworking',
  digitalMaturity: 'radarAxisDigital',
  teamSizeScore: 'radarAxisTeamSize',
  exchangeFrequency: 'radarAxisExchange',
};

/** Moyennes par axe : communauté entière + segments taille d’entreprise (échelle 0–5). */
export function computeRadarData(members: ExplorerMember[], lang: Language): RadarDatum[] {
  if (members.length === 0) return [];

  const bySize = {
    freelance: members.filter((m) => m.companySize === 'freelance'),
    pme: members.filter((m) => m.companySize === 'pme'),
    corporate: members.filter((m) => m.companySize === 'corporate'),
  };

  const avgForSegment = (axis: RadarAxis, segment: CompanySize): number | undefined => {
    const list = bySize[segment];
    if (list.length === 0) return undefined;
    return list.reduce((acc, m) => acc + (m[axis] ?? 0), 0) / list.length;
  };

  return RADAR_AXES.map((axis) => {
    const sum = members.reduce((acc, m) => acc + (m[axis] ?? 0), 0);
    const community = sum / members.length;

    return {
      axis,
      label: explorerProfilsT(lang, AXIS_I18N_KEY[axis]),
      community,
      freelance: avgForSegment(axis, 'freelance'),
      pme: avgForSegment(axis, 'pme'),
      corporate: avgForSegment(axis, 'corporate'),
    };
  });
}

export type VennCommunityResult = {
  a: number;
  b: number;
  intersection: number;
  extras: {
    totalAfterwork: number;
    fbAndAfterwork: number;
    networkingAndAfterwork: number;
    allThree: number;
  };
};

/** Venn simplifiée F&B vs Networking ; afterwork et croisements en `extras`. */
export function computeVennData(members: ExplorerMember[]): VennCommunityResult {
  const hasFB = (m: ExplorerMember) => m.tags.includes('F&B');
  const hasNetworking = (m: ExplorerMember) => m.tags.includes('Networking');
  const hasAfterwork = (m: ExplorerMember) => m.tags.includes('Afterwork');

  const totalFB = members.filter(hasFB).length;
  const totalNetworking = members.filter(hasNetworking).length;
  const totalAfterwork = members.filter(hasAfterwork).length;

  const fbAndNetworking = members.filter((m) => hasFB(m) && hasNetworking(m)).length;
  const fbAndAfterwork = members.filter((m) => hasFB(m) && hasAfterwork(m)).length;
  const networkingAndAfterwork = members.filter(
    (m) => hasNetworking(m) && hasAfterwork(m)
  ).length;
  const allThree = members.filter((m) => hasFB(m) && hasNetworking(m) && hasAfterwork(m)).length;

  return {
    a: totalFB,
    b: totalNetworking,
    intersection: fbAndNetworking,
    extras: {
      totalAfterwork,
      fbAndAfterwork,
      networkingAndAfterwork,
      allThree,
    },
  };
}
