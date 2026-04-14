import React, { useEffect, useMemo, useState } from 'react';
import type { Language } from '@/types';
import { sanitizePassionIds } from '@/lib/passionConfig';
// (keep format aligned; no extra deps needed here)

export type CompletionMember = {
  id: string;
  photo?: string;
  description?: string;
  secteur?: string;
  activityCategory?: string;
  positionCategory?: string;
  passionIds?: string[];
  links?: string[];
  city?: string;
};

type Row = { label: string; pct: number; color: 'emerald' | 'blue' | 'amber' };

function clampPct(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function barColor(pct: number): Row['color'] {
  if (pct >= 80) return 'emerald';
  if (pct >= 50) return 'blue';
  return 'amber';
}

function barFillClass(c: Row['color']) {
  if (c === 'emerald') return 'bg-emerald-500';
  if (c === 'blue') return 'bg-blue-700';
  return 'bg-amber-500';
}

export default function ProfileCompletionBars({
  members,
  lang,
}: {
  members: CompletionMember[];
  lang: Language;
}) {
  const rows = useMemo<Row[]>(() => {
    const total = Math.max(1, members?.length ?? 0);
    const count = {
      photo: 0,
      name: total, // non mesuré ici
      sector: 0,
      industry: 0,
      function: 0,
      desc: 0,
      contact: 0,
      passions: 0,
      city: 0,
    };

    (members ?? []).forEach((m) => {
      if (String(m.photo ?? '').trim()) count.photo++;
      if (String(m.secteur ?? '').trim()) count.sector++;
      if (String(m.activityCategory ?? '').trim()) count.industry++;
      if (String(m.positionCategory ?? '').trim()) count.function++;
      if (String(m.description ?? '').trim().length >= 30) count.desc++;
      if ((m.links ?? []).some((l) => String(l ?? '').trim())) count.contact++;
      if (sanitizePassionIds(m.passionIds).length >= 1) count.passions++;
      if (String(m.city ?? '').trim()) count.city++;
    });

    const tr = (fr: string, es: string, en: string) => (lang === 'es' ? es : lang === 'en' ? en : fr);

    const list: Array<{ key: keyof typeof count; label: string }> = [
      { key: 'photo', label: tr('Photo', 'Foto', 'Photo') },
      { key: 'sector', label: tr('Secteur', 'Sector', 'Sector') },
      { key: 'industry', label: tr('Industrie', 'Industria', 'Industry') },
      { key: 'function', label: tr('Poste', 'Puesto', 'Role') },
      { key: 'desc', label: tr('Description', 'Descripción', 'Description') },
      { key: 'passions', label: tr('Passions', 'Pasiones', 'Interests') },
      { key: 'contact', label: tr('Liens / contact', 'Links / contacto', 'Links / contact') },
      { key: 'city', label: tr('Ville', 'Ciudad', 'City') },
    ];

    return list.map(({ key, label }) => {
      const pct = clampPct((count[key] / total) * 100);
      return { label, pct, color: barColor(pct) };
    });
  }, [members, lang]);

  // tiny “animate in” like the HTML version
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-900">Taux de complétion profils</h3>
        <span className="text-xs text-stone-500">Par champ</span>
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-stone-800">{r.label}</span>
              <span className="text-xs font-semibold tabular-nums text-stone-500">{r.pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className={`h-full ${barFillClass(r.color)} transition-[width] duration-700 ease-out`}
                style={{ width: mounted ? `${r.pct}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

