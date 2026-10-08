import type { Timestamp } from 'firebase/firestore';

export type ExpressMemberRow = {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  city: string;
  companyName: string;
  lookingFor: string;
  communityGap: string;
  mexicoArrivalNote: string;
  nationality: string;
  isValidated: boolean | null;
  needsAdminReview: boolean;
  createdAt: Timestamp | null;
  communicationLanguage: 'fr' | 'es' | 'en' | '';
};

export type NameCount = { name: string; value: number };
export type DayCount = { date: string; count: number };

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function countBy(
  rows: ExpressMemberRow[],
  pick: (r: ExpressMemberRow) => string,
  emptyLabel: string,
  limit = 12
): NameCount[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = pick(r).trim() || emptyLabel;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function signupsByDay(rows: ExpressMemberRow[]): DayCount[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = r.createdAt?.toDate?.();
    if (!d) continue;
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export function validationBreakdown(
  rows: ExpressMemberRow[],
  labels: { validated: string; pending: string; other: string }
): NameCount[] {
  let validated = 0;
  let pending = 0;
  let other = 0;
  for (const r of rows) {
    if (r.isValidated === true) validated += 1;
    else if (r.isValidated === false || r.needsAdminReview) pending += 1;
    else other += 1;
  }
  return [
    { name: labels.validated, value: validated },
    { name: labels.pending, value: pending },
    { name: labels.other, value: other },
  ].filter((x) => x.value > 0);
}

export function quoteCards(
  rows: ExpressMemberRow[],
  field: 'lookingFor' | 'communityGap',
  limit = 12
): Array<{ id: string; name: string; city: string; text: string }> {
  return rows
    .filter((r) => r[field].trim().length >= 8)
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    })
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      name: r.fullName || r.email || r.id,
      city: r.city,
      text: clip(r[field], 280),
    }));
}

export function fieldFillRate(rows: ExpressMemberRow[], field: 'lookingFor' | 'communityGap' | 'mexicoArrivalNote'): number {
  if (rows.length === 0) return 0;
  const filled = rows.filter((r) => r[field].trim().length > 0).length;
  return Math.round((filled / rows.length) * 100);
}
