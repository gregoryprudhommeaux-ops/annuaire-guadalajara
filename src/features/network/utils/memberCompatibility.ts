import type { CompatibilityMember, CompatibilityReason } from '../types/compatibility';

export type { CompatibilityMember, CompatibilityReason } from '../types/compatibility';

type MaybeArray = string[] | undefined | null;

export function normalizeText(value?: string | null): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeArray(input?: MaybeArray): string[] {
  return (input ?? [])
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

export function normalizeKeywords(input?: string[] | string): string[] {
  if (Array.isArray(input)) return normalizeArray(input);
  return normalizeText(input)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function overlapCount(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const bSet = new Set(b);
  return a.filter((item) => bSet.has(item)).length;
}

function includesAny(text: string, candidates: string[]): boolean {
  return candidates.some((candidate) => candidate && text.includes(candidate));
}

function hasNeedHelpOverlap(currentUser: CompatibilityMember, other: CompatibilityMember): boolean {
  const userNeeds = normalizeArray(currentUser.currentNeeds);
  const otherNeeds = normalizeArray(other.currentNeeds);
  const userHelp = normalizeText(currentUser.helpOfferText);
  const otherHelp = normalizeText(other.helpOfferText);
  const userLookingFor = normalizeText(currentUser.lookingForText);
  const otherLookingFor = normalizeText(other.lookingForText);

  return (
    includesAny(otherHelp, userNeeds) ||
    includesAny(userHelp, otherNeeds) ||
    includesAny(otherLookingFor, userNeeds) ||
    includesAny(userLookingFor, otherNeeds)
  );
}

/** Même besoin structuré mis en avant (libellés normalisés identiques). */
function hasSharedHighlightedNeeds(currentUser: CompatibilityMember, other: CompatibilityMember): boolean {
  const a = normalizeArray(currentUser.currentNeeds);
  const b = normalizeArray(other.currentNeeds);
  return overlapCount(a, b) > 0;
}

function hasNeedSignal(currentUser: CompatibilityMember, other: CompatibilityMember): boolean {
  return hasNeedHelpOverlap(currentUser, other) || hasSharedHighlightedNeeds(currentUser, other);
}

function hasKeywordOverlap(currentUser: CompatibilityMember, other: CompatibilityMember): boolean {
  const a = normalizeKeywords(currentUser.keywords);
  const b = normalizeKeywords(other.keywords);
  return overlapCount(a, b) > 0;
}

function hasSharedPassions(currentUser: CompatibilityMember, other: CompatibilityMember): boolean {
  const a = normalizeArray(currentUser.passions);
  const b = normalizeArray(other.passions);
  return overlapCount(a, b) > 0;
}

function isSameSector(currentUser: CompatibilityMember, other: CompatibilityMember): boolean {
  return (
    normalizeText(currentUser.sector) !== '' &&
    normalizeText(currentUser.sector) === normalizeText(other.sector)
  );
}

function isSameCity(currentUser: CompatibilityMember, other: CompatibilityMember): boolean {
  return (
    normalizeText(currentUser.city) !== '' &&
    normalizeText(currentUser.city) === normalizeText(other.city)
  );
}

function hasMentoringOpenness(other: CompatibilityMember): boolean {
  const needle = normalizeText('Mentorat / partage d’expérience');
  return normalizeArray(other.openness).some((o) => o === needle || o.includes('mentorat'));
}

export function computeCompatibilityScore(
  currentUser: CompatibilityMember,
  other: CompatibilityMember
): number {
  if (!currentUser || !other) return 0;
  if (currentUser.id && other.id && currentUser.id === other.id) return 0;
  if (currentUser.slug && other.slug && currentUser.slug === other.slug) return 0;

  let score = 0;

  if (hasNeedSignal(currentUser, other)) score += 35;
  if (isSameSector(currentUser, other)) score += 15;
  if (isSameCity(currentUser, other)) score += 10;
  if (hasSharedPassions(currentUser, other)) score += 10;
  if (hasMentoringOpenness(other)) score += 10;
  if (hasKeywordOverlap(currentUser, other)) score += 15;

  return Math.min(score, 100);
}

export function getCompatibilityReasons(
  currentUser: CompatibilityMember,
  other: CompatibilityMember
): CompatibilityReason[] {
  const reasons: CompatibilityReason[] = [];

  if (hasNeedHelpOverlap(currentUser, other)) {
    reasons.push('Besoin compatible', 'Peut vous aider');
  } else if (hasSharedHighlightedNeeds(currentUser, other)) {
    reasons.push('Besoin compatible');
  }

  if (isSameSector(currentUser, other)) {
    reasons.push('Même secteur');
  }

  if (isSameCity(currentUser, other)) {
    reasons.push('Même ville');
  }

  if (hasSharedPassions(currentUser, other)) {
    reasons.push('Passion commune');
  }

  if (hasMentoringOpenness(other)) {
    reasons.push('Ouvert au mentorat');
  }

  if (hasKeywordOverlap(currentUser, other)) {
    reasons.push('Mots-clés proches');
  }

  return Array.from(new Set(reasons)).slice(0, 3);
}

export function getCompatibilityLevel(score: number): string | null {
  if (score >= 70) return 'Très pertinent';
  if (score >= 45) return 'Pertinent';
  if (score >= 25) return 'À explorer';
  return null;
}

/** Nombre d’étoiles pleines (0–5) à partir du score heuristique. */
export function compatibilityStarCount(score: number): number {
  if (score >= 70) return 5;
  if (score >= 45) return 4;
  if (score >= 25) return 3;
  return 0;
}
