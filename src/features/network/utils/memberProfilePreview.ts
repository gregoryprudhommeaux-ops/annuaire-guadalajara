export function getCleanPreviewText(
  value: string | undefined,
  fallback: string,
  maxLength = 210
): string {
  const clean = (value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return fallback;
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}…`;
}
