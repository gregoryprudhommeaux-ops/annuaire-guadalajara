import type { UrgentPost } from '../types';

/** Anciens posts « split » : métadonnées auteur dans une collection séparée. Les nouvelles annonces utilisent un seul doc `urgent_posts` (champs auteur sur le doc public). */
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

/** Fenêtre pour le repère admin (badge + panneau) : opportunités encore visibles et récentes. */
const URGENT_POST_ADMIN_RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isUrgentPostInAdminRecentWindow(
  p: UrgentPost,
  nowMs: number = Date.now()
): boolean {
  if (!isUrgentPostListedForEveryone(p)) return false;
  const created = p.createdAt ?? 0;
  if (created <= 0) return false;
  const expiresAt = p.expiresAt ?? 0;
  if (expiresAt > 0 && nowMs > expiresAt) return false;
  return nowMs - created <= URGENT_POST_ADMIN_RECENT_WINDOW_MS;
}

/** Lit un booléen Firestore même si le type stocké diffère (évite les annonces bloquées en « en attente » côté client). */
function readOptionalBoolean(raw: unknown): boolean | undefined {
  if (raw === true) return true;
  if (raw === false) return false;
  return undefined;
}

/**
 * Fusionne `urgent_posts` et, si présent, `urgent_post_private` (anciens enregistrements split).
 * Format courant : tout sur `urgent_posts` (authorId, authorName, … sur le doc public).
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
