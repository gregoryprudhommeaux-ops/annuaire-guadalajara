import type { UserProfile } from '@/types';
import { normalizedTargetKeywords } from '@/types';
import { profileDistinctActivityCategories } from '@/lib/companyActivities';
import { sanitizeHighlightedNeeds, sanitizeHighlightedOffers } from '@/needOptions';
import { normalizeText } from './memberCompatibility';
import { MEMBER_SIGNAL_MAP, NEED_CODE_TO_SIGNALS } from './memberSignalMatch';

export type MatchTier = 'strong' | 'medium' | 'low';

export type SmartMatch = {
  score: number;
  tier: MatchTier;
};

function setOfLower(xs: (string | undefined | null)[]): Set<string> {
  return new Set(xs.map((x) => String(x ?? '').trim().toLowerCase()).filter(Boolean));
}

function intersectCount(a: Set<string>, b: Set<string>): number {
  let n = 0;
  a.forEach((x) => {
    if (b.has(x)) n += 1;
  });
  return n;
}

function intersectUniqueCodes(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const sb = new Set(b);
  const seen = new Set<string>();
  let n = 0;
  for (const x of a) {
    if (!sb.has(x) || seen.has(x)) continue;
    seen.add(x);
    n += 1;
  }
  return n;
}

function withinOneTier(a: string, b: string): boolean {
  const order = ['solo', '2-10', '11-50', '50+'];
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia < 0 || ib < 0) return false;
  return Math.abs(ia - ib) <= 1;
}

function viewerActiveSignals(viewer: UserProfile): string[] {
  const viewerBio = (viewer.bio ?? '').trim() || (viewer.memberBio ?? '').trim();
  const blob = normalizeText(`${viewerBio} ${normalizedTargetKeywords(viewer).join(' ')}`);
  return Object.entries(MEMBER_SIGNAL_MAP)
    .filter(([, kws]) => kws.some((kw) => blob.includes(normalizeText(kw))))
    .map(([sig]) => sig);
}

function memberNeedSignals(member: UserProfile): string[] {
  const codes = sanitizeHighlightedNeeds(member.highlightedNeeds);
  const signals = new Set<string>();
  codes.forEach((c) => (NEED_CODE_TO_SIGNALS[c] ?? []).forEach((s) => signals.add(s)));
  return Array.from(signals);
}

export function computeSmartMatch(viewer: UserProfile, member: UserProfile, ctx: { viewingOutsidePrimaryCity: boolean; viewerPrimaryCity?: string }): SmartMatch {
  if (!viewer?.uid || !member?.uid || viewer.uid === member.uid) return { score: 0, tier: 'low' };

  let score = 0;

  // a) Sector overlap (use existing sector signals)
  const viewerSectors = setOfLower([...profileDistinctActivityCategories(viewer), ...normalizedTargetKeywords(viewer)]);
  const memberSectors = setOfLower([...profileDistinctActivityCategories(member), ...normalizedTargetKeywords(member)]);
  const sharedSectorCount = intersectCount(viewerSectors, memberSectors);
  if (sharedSectorCount > 0) {
    score += 30;
    if (sharedSectorCount > 1) score += (sharedSectorCount - 1) * 15;
  }

  // b) Structured reciprocity: same NEED_* vocabulary on both sides.
  const viewerNeeds = sanitizeHighlightedNeeds(viewer.highlightedNeeds);
  const viewerOffers = sanitizeHighlightedOffers(viewer.highlightedOffers);
  const memberNeeds = sanitizeHighlightedNeeds(member.highlightedNeeds);
  const memberOffers = sanitizeHighlightedOffers(member.highlightedOffers);

  const offerNeedHits =
    intersectUniqueCodes(memberOffers, viewerNeeds) + intersectUniqueCodes(viewerOffers, memberNeeds);
  if (offerNeedHits > 0) {
    score += Math.min(90, offerNeedHits * 35);
  } else {
    // Fallback (legacy profiles): bio/keyword signals × need codes → mapped signals.
    const viewerSignals = new Set(viewerActiveSignals(viewer));
    const mSignals = new Set(memberNeedSignals(member));
    const needMatches = intersectCount(viewerSignals, mSignals);
    if (needMatches > 0) score += Math.min(80, needMatches * 40);
  }

  // c) Language match
  const viewerLang = setOfLower(viewer.workingLanguageCodes ?? []);
  const memberLang = setOfLower(member.workingLanguageCodes ?? []);
  score += intersectCount(viewerLang, memberLang) * 10;

  // d) Company size compatibility
  if (viewer.companySize && member.companySize && withinOneTier(viewer.companySize, member.companySize)) {
    score += 10;
  }

  // e) Activity recency bonus
  const lastSeen = Number(member.lastSeen ?? 0);
  if (Number.isFinite(lastSeen) && lastSeen > 0) {
    const days = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);
    if (days <= 7) score += 10;
    else if (days <= 30) score += 5;
  }

  // f) Geographic affinity (outside primary city)
  if (ctx.viewingOutsidePrimaryCity && ctx.viewerPrimaryCity) {
    const city = String(member.city ?? '').trim();
    if (city && city.toLowerCase() === String(ctx.viewerPrimaryCity).trim().toLowerCase()) score += 5;
  }

  // clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  const tier: MatchTier = score >= 80 ? 'strong' : score >= 50 ? 'medium' : 'low';
  return { score, tier };
}

