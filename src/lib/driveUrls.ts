/**
 * Helpers for turning common Google Drive share links into usable URLs for <img src>.
 *
 * Notes:
 * - Drive can still require auth if the file isn't shared publicly.
 * - For best results, set the file to "Anyone with the link" (viewer).
 */

export function extractGoogleDriveFileId(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.hostname !== 'drive.google.com' && u.hostname !== 'docs.google.com') return '';

    // Pattern: https://drive.google.com/file/d/<id>/view
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m?.[1]) return m[1];

    // Pattern: https://drive.google.com/open?id=<id>
    const idParam = u.searchParams.get('id');
    if (idParam) return idParam;

    return '';
  } catch {
    return '';
  }
}

/**
 * Converts a Drive share link into a direct "view" URL suitable for <img src>.
 * Falls back to the original URL if it isn't recognized as Drive.
 */
export function toImageUrlFromMaybeDrive(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';

  const id = extractGoogleDriveFileId(s);
  if (!id) return s;

  // Drive "uc" endpoint usually returns the raw bytes when the file is public.
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
}

