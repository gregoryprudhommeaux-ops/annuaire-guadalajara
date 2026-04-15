const STORAGE_PREFIX = 'fn-network-rec:v1';

export type RecommendationPrefs = {
  /** Profils masqués des recommandations (« je le connais déjà »). */
  knownUids: string[];
  /** Profils marqués pour un suivi / contact ultérieur (même appareil). */
  savedUids: string[];
};

function key(viewerUid: string): string {
  return `${STORAGE_PREFIX}:${viewerUid}`;
}

function empty(): RecommendationPrefs {
  return { knownUids: [], savedUids: [] };
}

export function loadRecommendationPrefs(viewerUid: string): RecommendationPrefs {
  if (typeof window === 'undefined' || !viewerUid) return empty();
  try {
    const raw = window.localStorage.getItem(key(viewerUid));
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return empty();
    const o = parsed as Record<string, unknown>;
    const knownUids = Array.isArray(o.knownUids) ? o.knownUids.filter((x) => typeof x === 'string') : [];
    const savedUids = Array.isArray(o.savedUids) ? o.savedUids.filter((x) => typeof x === 'string') : [];
    return { knownUids, savedUids };
  } catch {
    return empty();
  }
}

export function saveRecommendationPrefs(viewerUid: string, prefs: RecommendationPrefs): void {
  if (typeof window === 'undefined' || !viewerUid) return;
  try {
    window.localStorage.setItem(key(viewerUid), JSON.stringify(prefs));
  } catch {
    /* quota / private mode */
  }
}
