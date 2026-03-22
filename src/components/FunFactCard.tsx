import React, { useId, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../cn';
import type { Language } from '@/types';
import type { MemberForFun, NeedForFun } from '@/lib/funFactData';

type FunFactCardProps = {
  lang: Language;
  members: MemberForFun[];
  needs: NeedForFun[];
  className?: string;
  collapsibleOnMobile?: boolean;
  mobileShowLabel?: string;
  mobileHideLabel?: string;
};

const funTranslations: Record<
  Language,
  Record<string, string> & {
    title: string;
    default: string;
    factTopSector: string;
    factCityCount: string;
    factPolyglot: string;
    factHobby: string;
    factNeed: string;
  }
> = {
  fr: {
    title: 'Fun fact du réseau',
    default:
      'Côté nouveaux arrivants, c’est plutôt calme cette semaine… Et toi, as-tu invité ton réseau à rejoindre cet annuaire ?',
    factTopSector:
      'Côté secteur, les nouveaux tirent vers « {{value}} » cette semaine — curieux, non ?',
    factCityCount:
      '{{count}} villes ou quartiers différents : la communauté s’étale bien autour de Guadalajara.',
    factPolyglot:
      'Petit côté Babel : {{percent}} % des nouveaux parlent au moins deux langues.',
    factHobby:
      'Côté passions, « {{value}} » revient souvent chez les nouveaux cette semaine.',
    factNeed:
      'Le besoin qui monte le plus cette semaine : {{value}}. À creuser ensemble ?',
  },
  en: {
    title: 'Network fun fact',
    default:
      'Pretty quiet on the “new members” front this week… Have you invited your network to join the directory yet?',
    factTopSector:
      'Sector-wise, new joiners are leaning toward {{value}} this week — interesting, right?',
    factCityCount:
      '{{count}} different areas or cities: the community is spreading nicely around Guadalajara.',
    factPolyglot:
      'Little Babel vibe: {{percent}}% of new members speak at least two languages.',
    factHobby:
      'On the passion side, “{{value}}” keeps popping up among newcomers this week.',
    factNeed:
      'Top need showing up this week: {{value}}. Worth a closer look?',
  },
  es: {
    title: 'Fun fact de la red',
    default:
      'Poca actividad de fichas nuevas esta semana… ¿Ya invitaste a tu red a unirse a este directorio?',
    factTopSector:
      'Por sectores, los nuevos apuntan a « {{value}} » esta semana — curioso, ¿no?',
    factCityCount:
      '{{count}} zonas o ciudades distintas: la comunidad se reparte bien alrededor de Guadalajara.',
    factPolyglot:
      'Aire multilingüe: el {{percent}} % de los nuevos habla al menos dos idiomas.',
    factHobby:
      'En pasiones, « {{value}} » suena mucho entre los nuevos esta semana.',
    factNeed:
      'La necesidad que más asoma esta semana: {{value}}. ¿Le damos una vuelta?',
  },
};

const needLabels: Record<Language, Record<string, string>> = {
  fr: {
    sourcing: 'sourcing / approvisionnement',
    partners: 'partenaires',
    recruitment: 'recrutement',
    visibility: 'visibilité',
    softlanding: 'installation (soft landing)',
    legal: 'juridique',
  },
  en: {
    sourcing: 'sourcing',
    partners: 'partners',
    recruitment: 'hiring',
    visibility: 'visibility',
    softlanding: 'soft landing',
    legal: 'legal',
  },
  es: {
    sourcing: 'sourcing',
    partners: 'socios',
    recruitment: 'reclutamiento',
    visibility: 'visibilidad',
    softlanding: 'aterrizaje suave',
    legal: 'legal',
  },
};

function pickRandom<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function interpolate(template: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
    template
  );
}

function computeTopSector(members: MemberForFun[]) {
  const map = new Map<string, number>();
  members.forEach((m) => {
    if (!m.sector || m.sector === '—') return;
    map.set(m.sector, (map.get(m.sector) ?? 0) + 1);
  });
  let top: { sector: string; count: number } | undefined;
  map.forEach((count, sector) => {
    if (!top || count > top.count) {
      top = { sector, count };
    }
  });
  return top;
}

function computeCityCount(members: MemberForFun[]) {
  return new Set(members.map((m) => m.city).filter(Boolean)).size;
}

function computePolyglotPercent(members: MemberForFun[]) {
  if (!members.length) return 0;
  const polyglots = members.filter((m) => (m.languages?.length ?? 0) >= 2).length;
  return Math.round((polyglots / members.length) * 100);
}

function computeTopHobby(members: MemberForFun[]) {
  const map = new Map<string, number>();
  members.forEach((m) => {
    (m.hobbies ?? []).forEach((h) => {
      const key = h.trim();
      if (!key) return;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
  });
  let top: { hobby: string; count: number } | undefined;
  map.forEach((count, hobby) => {
    if (!top || count > top.count) {
      top = { hobby, count };
    }
  });
  return top;
}

function computeTopNeed(needs: NeedForFun[]) {
  const map = new Map<string, number>();
  needs.forEach((n) => {
    if (!n.need) return;
    map.set(n.need, (map.get(n.need) ?? 0) + 1);
  });
  let top: { need: string; count: number } | undefined;
  map.forEach((count, need) => {
    if (!top || count > top.count) {
      top = { need, count };
    }
  });
  return top;
}

function labelNeed(lang: Language, needId: string): string {
  const row = needLabels[lang] ?? needLabels.fr;
  return row[needId] ?? needId;
}

export default function FunFactCard({
  lang,
  members,
  needs,
  className,
  collapsibleOnMobile = false,
  mobileShowLabel = 'Show fun fact',
  mobileHideLabel = 'Hide fun fact',
}: FunFactCardProps) {
  const t = funTranslations[lang] ?? funTranslations.fr;
  const [mobileOpen, setMobileOpen] = useState(true);
  const bodyId = useId();

  const message = useMemo(() => {
    const loc = funTranslations[lang] ?? funTranslations.fr;
    if (!members.length) {
      return loc.default;
    }

    const candidates: string[] = [];

    const topSector = computeTopSector(members);
    if (topSector) {
      candidates.push(interpolate(loc.factTopSector, { value: topSector.sector }));
    }

    const cityCount = computeCityCount(members);
    if (cityCount >= 1) {
      candidates.push(interpolate(loc.factCityCount, { count: cityCount }));
    }

    const pct = computePolyglotPercent(members);
    if (pct > 0) {
      candidates.push(interpolate(loc.factPolyglot, { percent: pct }));
    }

    const topHobby = computeTopHobby(members);
    if (topHobby) {
      candidates.push(interpolate(loc.factHobby, { value: topHobby.hobby }));
    }

    const topNeed = computeTopNeed(needs);
    if (topNeed) {
      candidates.push(
        interpolate(loc.factNeed, { value: labelNeed(lang, topNeed.need) })
      );
    }

    return pickRandom(candidates) ?? loc.default;
  }, [members, needs, lang]);

  const showToggle = collapsibleOnMobile;

  return (
    <aside
      className={cn(
        'rounded-xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/90 to-white px-4 py-4 sm:px-5 sm:py-5',
        className
      )}
    >
      <div className={cn(showToggle && 'flex items-start justify-between gap-3 sm:block')}>
        <p
          className={cn(
            'text-[11px] font-semibold uppercase tracking-wider text-indigo-800',
            showToggle && 'min-w-0 flex-1'
          )}
        >
          {t.title}
        </p>
        {showToggle ? (
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="-m-1 shrink-0 rounded-lg p-1.5 text-indigo-800/80 transition-colors hover:bg-indigo-100/60 hover:text-indigo-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:hidden"
            aria-expanded={mobileOpen}
            aria-controls={bodyId}
            title={mobileOpen ? mobileHideLabel : mobileShowLabel}
          >
            {mobileOpen ? (
              <ChevronUp className="h-5 w-5" strokeWidth={2} aria-hidden />
            ) : (
              <ChevronDown className="h-5 w-5" strokeWidth={2} aria-hidden />
            )}
            <span className="sr-only">{mobileOpen ? mobileHideLabel : mobileShowLabel}</span>
          </button>
        ) : null}
      </div>
      <p
        id={bodyId}
        className={cn(
          'mt-2 line-clamp-3 text-sm leading-snug text-stone-700 sm:mt-2 sm:block',
          showToggle && !mobileOpen && 'hidden'
        )}
      >
        {message}
      </p>
    </aside>
  );
}

export type { MemberForFun, NeedForFun } from '@/lib/funFactData';
export type { Language as Lang } from '@/types';
