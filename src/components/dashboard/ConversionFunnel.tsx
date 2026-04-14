import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { HelpCircle } from 'lucide-react';

export function conversionRate(a: number, b?: number) {
  return b && b > 0 ? `${Math.round((a / b) * 100)}%` : '–';
}

type Props = {
  visiteurs?: number;
  clicsInscription?: number;
  inscritsOAuth: number;
  profilsComplets: number;
  membresActifs: number;
};

export default function ConversionFunnel({
  visiteurs,
  clicsInscription,
  inscritsOAuth,
  profilsComplets,
  membresActifs,
}: Props) {
  const [open, setOpen] = useState(false);

  const stages = useMemo(() => {
    const v = typeof visiteurs === 'number' ? visiteurs : undefined;
    const c = typeof clicsInscription === 'number' ? clicsInscription : undefined;
    const s = [
      { label: 'Visiteurs uniques', value: v, optional: true },
      { label: "Clics 'Créer mon profil'", value: c, optional: true },
      { label: 'Inscrits OAuth', value: inscritsOAuth, optional: false },
      { label: 'Profils complétés', value: profilsComplets, optional: false },
      { label: 'Membres actifs', value: membresActifs, optional: false },
    ] as const;
    return s;
  }, [visiteurs, clicsInscription, inscritsOAuth, profilsComplets, membresActifs]);

  const values = stages.map((s) => (typeof s.value === 'number' ? s.value : 0));
  const max = Math.max(1, ...values);
  const colors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

  const series = [
    {
      name: 'Conversion',
      data: stages.map((s, i) => ({
        x: s.label,
        y: typeof s.value === 'number' ? s.value : 0,
        fillColor: s.optional && typeof s.value !== 'number' ? '#e5e7eb' : colors[i],
      })),
    },
  ];

  const options = {
    chart: { type: 'bar' as const, toolbar: { show: false } },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '62%',
        borderRadius: 6,
      },
    },
    xaxis: {
      max,
      labels: { style: { fontSize: '11px', colors: ['#64748b'] } },
    },
    yaxis: {
      labels: { style: { fontSize: '12px', colors: ['#334155'] } },
    },
    fill: { opacity: 1 },
    dataLabels: {
      enabled: true,
      formatter: (_: any, opts: any) => {
        const i = opts.dataPointIndex as number;
        const cur = stages[i];
        const prev = i > 0 ? stages[i - 1] : undefined;
        const v = cur?.value;
        const vv = typeof v === 'number' ? v : null;
        const pr = prev && typeof prev.value === 'number' ? prev.value : undefined;
        const rate = vv === null ? '–' : conversionRate(vv, pr);
        const down = i === 0 ? '' : `  ↓ ${rate}`;
        return `${cur.label}  ${vv === null ? '–' : vv}${down}`;
      },
      style: { fontSize: '11px', colors: ['#0f172a'] },
      background: { enabled: false },
    },
    tooltip: {
      y: {
        formatter: (v: number, opts: any) => {
          const i = opts.dataPointIndex as number;
          const cur = stages[i];
          const vv = typeof cur.value === 'number' ? cur.value : null;
          const pct = max > 0 && vv !== null ? Math.round((vv / max) * 100) : 0;
          return `${vv === null ? '–' : vv} représentent ${pct}% du total visiteurs`;
        },
      },
    },
    grid: { strokeDashArray: 3 },
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Funnel de conversion</h3>
          <p className="mt-1 text-xs text-stone-500">Du visiteur au membre actif</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"
          aria-label="Info visiteurs uniques"
          title="Info visiteurs uniques"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {open ? (
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
          Visiteurs uniques : donnée issue de Google Analytics / analytics site.
        </div>
      ) : null}

      <div className="mt-3 h-[300px] w-full">
        <ReactApexChart options={options as any} series={series as any} type="bar" height={300} />
      </div>
    </div>
  );
}

