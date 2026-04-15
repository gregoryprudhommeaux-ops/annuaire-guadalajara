import React, { useMemo } from 'react';
import type { Language } from '@/types';
import { calculateEngagementScore, type MemberWithStats } from '@/components/dashboard/EngagementLeaderboard';
import ProfileAvatar from '@/components/ProfileAvatar';
import { formatPersonName } from '@/shared/utils/formatPersonName';

function formatCompanyName(input?: string | null): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';

  // Normalize common separators spacing (keep it display-only).
  const normalized = raw
    .replace(/\s+/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*&\s*/g, ' & ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();

  const tokens = normalized.split(/(\s+|\/|&|-)/g);
  const out = tokens.map((t) => {
    // Keep separators/spaces as-is.
    if (!t || /^\s+$/.test(t) || t === '/' || t === '&' || t === '-') return t;

    // Preserve existing CamelCase or acronyms.
    if (/[A-Z].*[A-Z]/.test(t) && /[a-z]/.test(t)) return t;
    if (/^[A-Z0-9]{2,5}$/.test(t)) return t;

    const lower = t.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return out.join('').replace(/\s+/g, ' ').trim();
}

function dedupeActiveMembersById<T extends { id: string; score: number }>(members: T[]): T[] {
  const byId = new Map<string, T>();
  for (const m of members) {
    const id = String(m.id ?? '').trim();
    if (!id) continue;
    const existing = byId.get(id);
    if (!existing || m.score > existing.score) byId.set(id, m);
  }
  return Array.from(byId.values());
}

function displayKey(m: { nom?: string; entreprise?: string }): string {
  const name = formatPersonName(m.nom).trim().toLowerCase();
  const company = String(m.entreprise ?? '').trim().toLowerCase();
  if (name && company) return `${name}||${company}`;
  if (name) return name;
  return '';
}

function dedupeActiveMembersVisually<T extends { score: number; nom?: string; entreprise?: string }>(members: T[]): T[] {
  const byKey = new Map<string, T>();
  for (const m of members) {
    const key = displayKey(m);
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing || m.score > existing.score) byKey.set(key, m);
  }
  // Keep any rows we couldn't key (should be rare)
  const keyed = new Set(byKey.values());
  const unkeyed = members.filter((m) => !displayKey(m) || !keyed.has(m));
  return [...Array.from(byKey.values()), ...unkeyed];
}

function badgeClass(secteur?: string) {
  const s = String(secteur ?? '').toLowerCase();
  if (s.includes('tech')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s.includes('f&b') || s.includes('food') || s.includes('gastr')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s.includes('finance')) return 'bg-teal-50 text-teal-700 border-teal-200';
  if (s.includes('conseil')) return 'bg-violet-50 text-violet-700 border-violet-200';
  return 'bg-stone-50 text-stone-700 border-stone-200';
}

function dots(score: number) {
  const n = Math.max(0, Math.min(5, Math.round(score / 20)));
  return Array.from({ length: 5 }, (_, i) => i < n);
}

export default function TopActiveMembersTable({
  members,
  lang,
}: {
  members: MemberWithStats[];
  lang: Language;
}) {
  const rows = useMemo(() => {
    const list = (members ?? []).map((m) => ({ ...m, score: calculateEngagementScore(m) }));
    const dedupedById = dedupeActiveMembersById(list);
    const dedupedVisible = dedupeActiveMembersVisually(dedupedById);
    dedupedVisible.sort((a, b) => b.score - a.score);
    return dedupedVisible.slice(0, 8);
  }, [members]);

  if ((members?.length ?? 0) < 2) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-stone-900">Membres les plus actifs</h3>
          <span className="text-xs text-stone-500">Score</span>
        </div>
        <p className="mt-4 text-sm text-stone-500">—</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-900">Membres les plus actifs</h3>
        <span className="text-xs text-stone-500">Score d'engagement</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-stone-200">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[520px] w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr className="text-[11px] font-semibold uppercase tracking-wide">
              <th className="px-3 py-2">Membre</th>
              <th className="px-3 py-2">Entreprise</th>
              <th className="px-3 py-2">Secteur</th>
              <th className="px-3 py-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-stone-50">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-blue-50 text-blue-700">
                      <ProfileAvatar
                        photoURL={m.photo}
                        fullName={formatPersonName(m.nom)}
                        className="h-full w-full bg-blue-50"
                        initialsClassName="text-[11px] text-blue-800"
                        iconSize={16}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {formatPersonName(m.nom)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <p
                    className="max-w-[240px] truncate text-sm font-semibold text-stone-800"
                    title={formatCompanyName(m.entreprise) || '—'}
                  >
                    {formatCompanyName(m.entreprise) || '—'}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex max-w-[220px] items-center truncate rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClass(
                      m.secteur
                    )}`}
                    title={m.secteur ?? '—'}
                  >
                    <span className="truncate">{m.secteur ?? '—'}</span>
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex gap-1">
                      {dots(m.score).map((on, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-blue-700' : 'bg-stone-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold tabular-nums text-stone-600">{m.score}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

