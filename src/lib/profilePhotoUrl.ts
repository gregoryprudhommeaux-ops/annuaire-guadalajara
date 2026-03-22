/**
 * Hôtes dont les images ne s’affichent généralement pas dans un <img> sur un autre site
 * (politique LinkedIn : pas d’affichage tiers, URLs signées qui expirent, etc.).
 */
export function isLikelyNonEmbeddablePhotoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const normalized =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
    const u = new URL(normalized);
    const h = u.hostname.toLowerCase();
    if (h === 'linkedin.com' || h.endsWith('.linkedin.com')) return true;
    if (h.includes('licdn.com') || h.includes('licdn.cn')) return true;
    return false;
  } catch {
    return false;
  }
}
