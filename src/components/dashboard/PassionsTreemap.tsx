import React, { useMemo } from 'react';
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts';
import { getPassionEmoji, getPassionLabel, sanitizePassionIds } from '@/lib/passionConfig';
import type { Language } from '@/types';

export type MemberForPassions = {
  id: string;
  nom: string;
  passionIds?: string[];
};

type Node = {
  name: string;
  value: number;
  id: string;
};

function normalizeLang(lang: Language): 'fr' | 'es' | 'en' {
  return lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
}

export default function PassionsTreemap({
  members,
  lang,
  onPickPassion,
}: {
  members: MemberForPassions[];
  lang: Language;
  onPickPassion?: (passionId: string) => void;
}) {
  const locale = normalizeLang(lang);

  const nodes: Node[] = useMemo(() => {
    const counts = new Map<string, number>();
    (members ?? []).forEach((m) => {
      const ids = sanitizePassionIds(m.passionIds);
      ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    });
    return Array.from(counts.entries())
      .map(([id, count]) => ({
        id,
        value: count,
        name: `${getPassionEmoji(id)} ${getPassionLabel(id, locale)}`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [members, locale]);

  const hasData = nodes.length > 0;

  const treeData = useMemo(() => {
    const top = nodes.slice(0, 24);
    const rest = nodes.slice(24);
    const restCount = rest.reduce((a, b) => a + b.value, 0);
    const children = restCount > 0 ? [...top, { id: 'other', name: 'Autres', value: restCount }] : top;
    return [{ name: 'Passions', children }];
  }, [nodes]);

  if (!hasData) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">Hobbies & passions</h3>
        <p className="mt-1 text-xs text-stone-500">Cliquez pour explorer les intérêts</p>
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
          Aucun centre d’intérêt structuré pour l’instant (à compléter dans les profils).
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">Hobbies & passions</h3>
      <p className="mt-1 text-xs text-stone-500">Surface = popularité (top 24 + “Autres”)</p>
      <div className="mt-3 h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treeData as any}
            dataKey="value"
            nameKey="name"
            stroke="#ffffff"
            fill="#6366f1"
            aspectRatio={4 / 3}
            isAnimationActive={false}
            content={(props: any) => {
              const { x, y, width, height, name, payload } = props;
              const id = payload?.id as string | undefined;
              const v = payload?.value as number | undefined;
              const clickable = Boolean(id && id !== 'other' && onPickPassion);
              return (
                <g
                  onClick={() => (clickable ? onPickPassion?.(id as string) : null)}
                  style={{ cursor: clickable ? 'pointer' : 'default' }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={id === 'other' ? '#94a3b8' : '#6366f1'}
                    stroke="#ffffff"
                    strokeWidth={2}
                    rx={10}
                    ry={10}
                  />
                  {width > 90 && height > 38 ? (
                    <>
                      <text x={x + 10} y={y + 18} fill="#ffffff" fontSize={12} fontWeight={700}>
                        {String(name ?? '')}
                      </text>
                      {typeof v === 'number' ? (
                        <text x={x + 10} y={y + 36} fill="#e2e8f0" fontSize={11}>
                          {v}
                        </text>
                      ) : null}
                    </>
                  ) : null}
                </g>
              );
            }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value: any, _name: any, item: any) => {
              const id = item?.payload?.id;
              if (id === 'other') return [String(value ?? ''), 'Autres'];
              return [String(value ?? ''), String(item?.payload?.name ?? '')];
            }}
          />
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-stone-600">
        {nodes.length} passions détectées · cliquez une tuile pour voir les membres concernés
      </p>
    </div>
  );
}

