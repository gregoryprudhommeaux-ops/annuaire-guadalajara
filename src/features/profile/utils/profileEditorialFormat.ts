export function normalizeInlineText(value: string | undefined): string {
  return (value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTextareaText(value: string | undefined): string {
  return (value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function getSoftCounterState(
  value: string | undefined,
  softMax: number,
  hardMax: number
): 'ok' | 'warning' | 'danger' {
  const length = normalizeInlineText(value).length;
  if (length > hardMax) return 'danger';
  if (length > softMax) return 'warning';
  return 'ok';
}

export function splitKeywords(value: string | undefined): string[] {
  return normalizeInlineText(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function rebuildKeywords(value: string | undefined): string {
  return splitKeywords(value).join(', ');
}
