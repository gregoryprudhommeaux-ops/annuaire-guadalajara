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

export function getPreferredContactPreview(value: string | undefined): string {
  const clean = (value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return 'Contact non précisé.';
  if (clean.length <= 80) return clean;
  return `${clean.slice(0, 80).trim()}…`;
}
