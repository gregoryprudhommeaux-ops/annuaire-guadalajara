import { NEED_OPTIONS } from '@/needOptions';
import type { Language } from '@/types';
import { normalizeText } from './memberCompatibility';

/** Carte signaux détectés dans la bio / mots-clés du visiteur. */
export const MEMBER_SIGNAL_MAP: Record<string, string[]> = {
  investisseurs: ['investisseur', 'investisseurs', 'fonds', 'fund', 'capital', 'financement', 'levée'],
  strategie: [
    'stratégie',
    'strategie',
    'développement commercial',
    'developpement commercial',
    'business development',
    'partenariat',
    'croissance',
  ],
  international: [
    'mexique',
    'france',
    'international',
    'sourcing',
    'implantation',
    'go-to-market',
    'go to market',
  ],
  structuration: [
    'structuration',
    'accompagnement',
    'advisory',
    'conseil',
    'network',
    'réseau',
    'reseau',
  ],
};

/** Besoins structurés (codes NEED_*) → signaux actifs requis côté membre affiché. */
export const NEED_CODE_TO_SIGNALS: Record<string, string[]> = {
  NEED_CLIENTS: ['strategie', 'international', 'structuration'],
  NEED_PARTNERS: ['strategie', 'international', 'structuration'],
  NEED_INVESTORS: ['investisseurs', 'strategie'],
  NEED_MENTOR: ['strategie', 'structuration', 'investisseurs'],
  NEED_MKT: ['strategie'],
};

const UI_LANGS: Language[] = ['fr', 'es', 'en'];

let needNormToSignalsCache: Map<string, string[]> | null = null;

function needNormalizedToSignals(): Map<string, string[]> {
  if (!needNormToSignalsCache) {
    const map = new Map<string, string[]>();
    for (const g of NEED_OPTIONS) {
      for (const o of g.options) {
        const signals = NEED_CODE_TO_SIGNALS[o.value];
        if (!signals) continue;
        for (const lang of UI_LANGS) {
          map.set(normalizeText(o.label[lang]), signals);
        }
      }
    }
    needNormToSignalsCache = map;
  }
  return needNormToSignalsCache;
}

function signalsForMemberNeedLabel(needLabel: string): string[] {
  return needNormalizedToSignals().get(normalizeText(needLabel)) ?? [];
}

export type MatchResult = {
  isRelevant: boolean;
  score: number;
  matchedNeeds: string[];
  matchedSignals: string[];
  /** Renseigné par l’appelant (i18n). */
  reason: string;
};

export type MemberCardMatchResult = MatchResult;

export function computeMemberMatch(
  currentUserBio: string,
  currentUserKeywords: string[],
  memberNeeds: string[]
): MatchResult {
  const textBlob = normalizeText(`${currentUserBio} ${currentUserKeywords.join(' ')}`);

  const activeSignals = Object.entries(MEMBER_SIGNAL_MAP)
    .filter(([, keywords]) => keywords.some((kw) => textBlob.includes(normalizeText(kw))))
    .map(([signal]) => signal);

  const matchedNeeds = memberNeeds.filter((need) => {
    const mappedSignals = signalsForMemberNeedLabel(need);
    return mappedSignals.some((signal) => activeSignals.includes(signal));
  });

  const score = Math.min(100, matchedNeeds.length * 35 + activeSignals.length * 10);

  return {
    isRelevant: matchedNeeds.length > 0,
    score,
    matchedNeeds,
    matchedSignals: activeSignals,
    reason: '',
  };
}
