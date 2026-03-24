import type { UrgentPost } from '../types';

/** Métadonnées auteur (collection séparée ; non lisible par les invités). */
export const URGENT_POST_PRIVATE_COLLECTION = 'urgent_post_private';

export type UrgentPostPrivateDoc = {
  authorId: string;
  authorName: string;
  authorCompany?: string;
  authorPhoto: string;
};

/** Opportunité visible dans les listes publiques (publiée ou ancien format). */
export function isUrgentPostListedForEveryone(p: UrgentPost): boolean {
  return p.isPublished !== false;
}

export function isUrgentPostPendingModeration(p: UrgentPost): boolean {
  return p.isPublished === false;
}

/** Lit un booléen Firestore même si le type stocké diffère (évite les annonces bloquées en « en attente » côté client). */
function readOptionalBoolean(raw: unknown): boolean | undefined {
  if (raw === true) return true;
  if (raw === false) return false;
  return undefined;
}

/**
 * Fusionne le document `urgent_posts` et éventuellement `urgent_post_private`.
 * Anciens documents : champs auteur encore sur `urgent_posts`.
 */
export function mergeUrgentPostFromFirestore(
  id: string,
  pub: Record<string, unknown>,
  priv?: UrgentPostPrivateDoc | null
): UrgentPost {
  const legacyAuthorId = typeof pub.authorId === 'string' && (pub.authorId as string).length > 0;
  if (legacyAuthorId) {
    const pubPub = readOptionalBoolean(pub.isPublished);
    return {
      id,
      text: String(pub.text ?? ''),
      sector: String(pub.sector ?? ''),
      createdAt: Number(pub.createdAt ?? 0),
      expiresAt: Number(pub.expiresAt ?? 0),
      isPublished: pubPub !== false,
      authorId: pub.authorId as string,
      authorName: String(pub.authorName ?? ''),
      authorCompany: String(pub.authorCompany ?? ''),
      authorPhoto: String(pub.authorPhoto ?? ''),
    };
  }
  const isPublished = readOptionalBoolean(pub.isPublished);
  const base: UrgentPost = {
    id,
    text: String(pub.text ?? ''),
    sector: String(pub.sector ?? ''),
    createdAt: Number(pub.createdAt ?? 0),
    expiresAt: Number(pub.expiresAt ?? 0),
    isPublished,
    authorId: priv?.authorId,
    authorName: priv?.authorName,
    authorCompany: priv?.authorCompany ?? '',
    authorPhoto: priv?.authorPhoto ?? '',
  };
  return base;
}
