/**
 * Canonical display form for Mexican / ZMG cities used in profiles + EXPRESS charts.
 * Avoids chart duplicates like "Guadalajara" vs "GUADALAJARA".
 */

function stripDiacritics(raw: string): string {
  return raw.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function cityToken(raw: string): string {
  return stripDiacritics(raw).toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Known hubs → display spelling (matches `CITIES` where applicable). */
const CANONICAL_BY_TOKEN: Record<string, string> = {
  guadalajara: 'Guadalajara',
  gdl: 'Guadalajara',
  zapopan: 'Zapopan',
  tlaquepaque: 'Tlaquepaque',
  tonala: 'Tonalá',
  'tlajomulco de zuniga': 'Tlajomulco de Zúñiga',
  tlajomulco: 'Tlajomulco de Zúñiga',
  'el salto': 'El Salto',
  jocotepec: 'Jocotepec',
  chapala: 'Chapala',
  ajijic: 'Ajijic',
  autre: 'Autre',
  other: 'Autre',
  otro: 'Autre',
};

function titleCaseWords(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => {
      if (!w) return w;
      // Keep short particles lowercase when mid-name (de, del, la…) except first word
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\bDe\b/g, 'de')
    .replace(/\bDel\b/g, 'del')
    .replace(/\bLa\b/g, 'la')
    .replace(/^la /, 'La ')
    .replace(/^de /, 'De ')
    .replace(/^del /, 'Del ');
}

/** Returns a stable display city name, or empty string if blank. */
export function canonicalizeCity(raw: string | null | undefined): string {
  const trimmed = String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const token = cityToken(trimmed);
  if (CANONICAL_BY_TOKEN[token]) return CANONICAL_BY_TOKEN[token];

  // Prefix / contains matches for common free-text variants
  if (token.includes('guadalajara')) return 'Guadalajara';
  if (token.includes('zapopan')) return 'Zapopan';
  if (token.includes('tlaquepaque')) return 'Tlaquepaque';
  if (token.includes('tonala')) return 'Tonalá';
  if (token.includes('tlajomulco')) return 'Tlajomulco de Zúñiga';
  if (token.includes('el salto')) return 'El Salto';
  if (token.includes('jocotepec')) return 'Jocotepec';

  return titleCaseWords(trimmed);
}
