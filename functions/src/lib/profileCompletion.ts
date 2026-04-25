/**
 * Calcul de complétion serveur-side, simple et sans dépendance front.
 * 6 critères de pondération égale → 0 à 100 (entier).
 */
export type CompletionInput = {
  fullName?: string;
  companyName?: string;
  photoURL?: string;
  activityCategory?: string;
  memberBio?: string;
  activityDescription?: string;
};

const FIELDS: Array<(d: CompletionInput) => boolean> = [
  (d) => Boolean(String(d.fullName ?? '').trim()),
  (d) => Boolean(String(d.companyName ?? '').trim()),
  (d) => Boolean(String(d.photoURL ?? '').trim()),
  (d) => Boolean(String(d.activityCategory ?? '').trim()),
  (d) => String(d.memberBio ?? '').trim().length >= 30,
  (d) => String(d.activityDescription ?? '').trim().length >= 30,
];

export function computeCompletionRate(input: CompletionInput): number {
  const filled = FIELDS.reduce((acc, fn) => acc + (fn(input) ? 1 : 0), 0);
  return Math.round((filled / FIELDS.length) * 100);
}

export type DisplayName = {
  /** Pseudo d'affichage : displayName si présent (côté Auth), sinon fullName, sinon fallback. */
  displayName: string;
};

export function pickDisplayName(d: {
  displayName?: string;
  fullName?: string;
}): string {
  const a = String(d.displayName ?? '').trim();
  if (a) return a;
  const b = String(d.fullName ?? '').trim();
  if (b) return b;
  return 'cher membre';
}
