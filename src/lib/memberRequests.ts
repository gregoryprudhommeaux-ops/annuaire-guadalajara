import type { MemberNetworkRequest } from '../types';

export const MEMBER_REQUESTS_COLLECTION = 'member_requests';

/** Durée d’affichage par défaut (30 jours). */
export const MEMBER_REQUEST_DEFAULT_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function mapMemberRequestDoc(
  id: string,
  data: Record<string, unknown>
): MemberNetworkRequest {
  const createdAt =
    typeof data.createdAt === 'number' && Number.isFinite(data.createdAt)
      ? data.createdAt
      : 0;
  const expiresAt =
    typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt)
      ? data.expiresAt
      : 0;
  return {
    id,
    authorId: String(data.authorId ?? ''),
    authorName: String(data.authorName ?? ''),
    authorPhoto: String(data.authorPhoto ?? ''),
    authorCompany:
      data.authorCompany != null && String(data.authorCompany).trim() !== ''
        ? String(data.authorCompany)
        : undefined,
    text: String(data.text ?? ''),
    sector:
      data.sector != null && String(data.sector).trim() !== ''
        ? String(data.sector)
        : undefined,
    zone:
      data.zone != null && String(data.zone).trim() !== ''
        ? String(data.zone)
        : undefined,
    productOrService:
      data.productOrService != null && String(data.productOrService).trim() !== ''
        ? String(data.productOrService)
        : undefined,
    createdAt,
    expiresAt,
  };
}
