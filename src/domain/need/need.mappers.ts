import type { MemberNetworkRequest } from '../../types';
import type { NetworkRequest } from './need.types';

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

