import React, { useEffect, useState } from 'react';
import { Compass, Handshake, Radar } from 'lucide-react';
import type { Language } from '@/types';
import { getStatsVitrineCopy } from '@/i18n/statsVitrine';
import { StatsCard, StatsPrimaryButton, StatsSectionHeader, StatsSectionShell } from '@/components/stats/ui';

type Persona = {
  title: string;
  body: string;
  micro: string;
  cta: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
};

type CardProps = {
  persona: Persona;
  index: number;
};

function PersonaCard({ persona, index }: CardProps) {
  const { title, body, micro, cta, to, Icon } = persona;
  return (
    <StatsCard
      className="seg-join-card seg-join-card-anim !flex h-full !flex-col !sm:p-6 overflow-hidden transition motion-safe:hover:border-slate-300/90 motion-safe:hover:shadow-md"
      style={{ animationDelay: `${80 + index * 70}ms` }}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f5f5]/60 text-[#01696f]" aria-hidden>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-extrabold leading-snug text-slate-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{body}</p>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{micro}</p>
      <div className="mt-4 pt-1">
        <StatsPrimaryButton to={to} className="w-full">
          {cta}
        </StatsPrimaryButton>
      </div>
    </StatsCard>
  );
}

/**
 * Bloc de conversion final segmenté (3 profils) pour la page `/stats`.
 */
export function SegmentedJoinCTA({ lang }: { lang: Language }) {
  const sj = getStatsVitrineCopy(lang).segmentedJoin;
  const personas: Persona[] = [
    { ...sj.p1, Icon: Compass },
    { ...sj.p2, Icon: Handshake },
    { ...sj.p3, Icon: Radar },
  ];
  const c = { eyebrow: sj.eyebrow, title: sj.title, lead: sj.lead, footer: sj.footer, brandCta: sj.brandCta };
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <section
      className={`seg-join-cta mt-10 print:break-inside-avoid ${
        reveal ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-500 motion-reduce:opacity-100 motion-reduce:duration-0`}
      aria-labelledby="seg-join-cta-title"
    >
      <StatsSectionShell>
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
          <StatsSectionHeader
            eyebrow={c.eyebrow}
            title={c.title}
            titleId="seg-join-cta-title"
            description={c.lead}
          />
        </div>
        <div className="p-4 sm:p-6">

        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p, i) => (
            <li key={i} className="h-full min-h-0 min-w-0">
              <PersonaCard persona={p} index={i} />
            </li>
          ))}
        </ul>
        </div>

        <div className="border-t border-slate-100 px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-sm leading-relaxed text-slate-700">
            {c.footer}
          </p>
          <div className="mt-4 flex justify-center sm:justify-center print:justify-center">
            <StatsPrimaryButton to="/inscription" className="w-full max-w-md sm:w-auto">
              {c.brandCta}
            </StatsPrimaryButton>
          </div>
        </div>
      </StatsSectionShell>
    </section>
  );
}
