const LOWERCASE_PARTICLES = new Set([
  'de',
  'del',
  'de la',
  'de las',
  'de los',
  'da',
  'das',
  'do',
  'dos',
  'di',
  'du',
  'des',
  'la',
  'las',
  'le',
  'les',
  'los',
  'van',
  'von',
  'den',
  'der',
  'ten',
  'ter',
  'bin',
  'ibn',
  'al',
  'el',
  'y',
]);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function capitalizeSimple(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function capitalizeAfterApostrophe(word: string): string {
  const apostropheParts = word.split("'");
  return apostropheParts
    .map((part) => {
      if (!part) return part;
      return capitalizeSimple(part);
    })
    .join("'");
}

function capitalizeHyphenated(word: string): string {
  return word
    .split('-')
    .map((part) => capitalizeAfterApostrophe(part))
    .join('-');
}

function normalizeWord(word: string, isFirstWord: boolean): string {
  const lower = word.toLowerCase();
  if (!isFirstWord && LOWERCASE_PARTICLES.has(lower)) return lower;
  return capitalizeHyphenated(lower);
}

export function formatPersonName(input?: string | null): string {
  if (!input) return '';

  const cleaned = normalizeWhitespace(input);
  if (!cleaned) return '';

  const words = cleaned.split(' ');
  const output: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const current = words[i]?.toLowerCase() ?? '';
    const next = words[i + 1]?.toLowerCase() ?? '';
    const next2 = words[i + 2]?.toLowerCase() ?? '';

    const triple = [current, next, next2].filter(Boolean).join(' ');
    const double = [current, next].filter(Boolean).join(' ');

    if (i > 0 && LOWERCASE_PARTICLES.has(triple)) {
      output.push(current, next, next2);
      i += 2;
      continue;
    }

    if (i > 0 && LOWERCASE_PARTICLES.has(double)) {
      output.push(current, next);
      i += 1;
      continue;
    }

    output.push(normalizeWord(words[i] ?? '', i === 0));
  }

  return output.join(' ');
}

