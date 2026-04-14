import type { MemberNetworkRequest } from '../../types';
import type { NeedCategoryKey } from '../taxonomy/taxonomy.types';
import type { Need, NetworkRequest } from './need.types';

type LegacyNeedInput = {
  id?: string;
  memberId?: string;
  text?: string;
  categories?: string[];
};

const CATEGORY_MAP: Record<string, NeedCategoryKey> = {
  'Nouveaux clients / comptes finaux': 'new_clients',
  'Distributeurs / revendeurs / agents': 'distributors_resellers_agents',
  'Partenaires commerciaux / stratégiques': 'strategic_partners',
  'Fournisseurs / fabricants / sous-traitants': 'suppliers_manufacturers',
  'Prestataires de services': 'service_providers',
  'Investisseurs / financement': 'investors_funding',
  'Support juridique / conformité': 'legal_support',
  'Support RH / recrutement / formation': 'hr_support',
  'Support comptable / fiscal / financier': 'finance_support',
  'Support IT / digital / cybersécurité': 'it_support',
  'Support marketing / communication / design': 'marketing_support',
  'Support logistique / transport / entreposage': 'logistics_support',
  'Études de marché / veille / data': 'market_intelligence',
  'Mentorat / conseil stratégique / board': 'mentoring_board',
  'Visibilité / média / RP': 'visibility_pr',
  'Partenaires locaux (chambres, clusters…)': 'local_institutions',
  'Autre besoin / non précisé': 'other',
};

export function mapLegacyNeedToCanonical(input: LegacyNeedInput): Need {
  const categories = (input.categories ?? [])
    .map((item) => CATEGORY_MAP[item])
    .filter((k): k is NeedCategoryKey => k !== undefined);

  return {
    id: input.id ?? crypto.randomUUID(),
    memberId: input.memberId ?? '',
    title: input.text?.slice(0, 120) || 'Besoin du réseau',
    description: input.text ?? '',
    categories,
    visibility: 'public',
    status: 'active',
  };
}

export function mapLegacyMemberRequestToNetworkRequest(r: MemberNetworkRequest): NetworkRequest {
  return {
    id: r.id,
    authorId: r.authorId,
    authorName: r.authorName,
    authorPhotoUrl: r.authorPhoto || undefined,
    authorCompany: r.authorCompany?.trim() || undefined,
    text: r.text,
    textTranslations: r.textTranslations,
    sector: r.sector?.trim() || undefined,
    zone: r.zone?.trim() || undefined,
    productOrService: r.productOrService?.trim() || undefined,
    createdAtMs: r.createdAt,
    expiresAtMs: r.expiresAt,
  };
}

