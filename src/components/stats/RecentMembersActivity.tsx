import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import {
  Building2,
  Briefcase,
  Factory,
  Laptop,
  Package,
  UtensilsCrossed,
} from 'lucide-react';
import { activityCategoryLabel } from '@/constants';
import { db } from '@/firebase';
import {
  getMemberSectorKey,
  getPrimaryNeedLine,
  getRelativeTimeLabel,
} from '@/lib/recentMembersActivityUtils';
import type { Language } from '@/types';
import type { UserProfile } from '@/types';

const BRAND = '#1a3a2a';

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  ctaLine: string;
  cta: string;
  empty: string;
  sectorFallback: string;
};

function tcopy(lang: Language): Copy {
  if (lang === 'en') {
    return {
      eyebrow: 'Recent activity',
      title: 'They recently joined the network',
      lead: 'Varied profiles, concrete needs, and visible momentum.',
      ctaLine: 'Every day, new qualified profiles join the network.',
      cta: 'Join the network',
      empty: 'The first members are building the network’s foundation.',
      sectorFallback: 'Professional activity',
    };
  }
  if (lang === 'es') {
    return {
      eyebrow: 'Actividad reciente',
      title: 'Se unieron a nosotros en los últimos días',
      lead: 'Perfiles variados, necesidades concretas, dinamismo visible.',
      ctaLine: 'Cada día, nuevos perfiles cualificados se unen a la red.',
      cta: 'Unirse a la red',
      empty: 'Los primeros miembros están construyendo la base de la red.',
      sectorFallback: 'Actividad profesional',
    };
  }
  return {
    eyebrow: 'Activité récente',
    title: 'Ils nous ont rejoints ces derniers jours',
    lead: 'Des profils variés, des besoins concrets, une dynamique visible.',
    ctaLine: 'Chaque jour, de nouveaux profils qualifiés rejoignent le réseau.',
    cta: 'Rejoindre le réseau',
    empty: 'Les premiers membres construisent actuellement la base du réseau.',
    sectorFallback: 'Activité professionnelle',
  };
}

type SectorVisual = {
  Icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  iconColor: string;
};

const SECTOR_ATLAS: { test: (s: string) => boolean; v: SectorVisual }[] = [
  {
    test: (s) => /agriculture|agroaliment|aliment/i.test(s),
    v: {
      Icon: UtensilsCrossed,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  },
  {
    test: (s) => /technolog|informatique|it\b/i.test(s),
    v: {
      Icon: Laptop,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  },
  {
    test: (s) => /commerce|distribution|détail|retail|hôtell|restaur|tourisme/i.test(s),
    v: {
      Icon: Package,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  },
  {
    test: (s) => /conseil|services aux entreprises|banque|finance|juridique/i.test(s),
    v: {
      Icon: Briefcase,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  },
  {
    test: (s) => /industrie|manufactur|automobile|énergie|bâtiment|immobilier|santé/i.test(s),
    v: {
      Icon: Factory,
      bgColor: 'bg-slate-50',
      iconColor: 'text-slate-600',
    },
  },
];

const SECTOR_DEFAULT: SectorVisual = {
  Icon: Building2,
  bgColor: 'bg-gray-50',
  iconColor: 'text-gray-600',
};

function getSectorVisualSector(storedKey: string): SectorVisual {
  if (!storedKey.trim()) return SECTOR_DEFAULT;
  for (const row of SECTOR_ATLAS) {
    if (row.test(storedKey)) return row.v;
  }
  return SECTOR_DEFAULT;
}

function CardRow({
  profile,
  lang,
  sectorFallback,
}: {
  profile: UserProfile;
  lang: Language;
  sectorFallback: string;
}) {
  const key = getMemberSectorKey(profile);
  const sector =
    (key && activityCategoryLabel(key, lang)) || sectorFallback;
  const { Icon, bgColor, iconColor } = getSectorVisualSector(key);
  const need = getPrimaryNeedLine(profile, lang);
  const when = getRelativeTimeLabel(profile.createdAt, lang);

  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-4 transition-shadow duration-200 motion-reduce:transition-none print:break-inside-avoid hover:shadow-sm"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${bgColor}`}
        aria-hidden
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{sector}</p>
        <p className="text-xs text-slate-600">{need}</p>
        <p className="mt-1 text-xs text-slate-400">{when}</p>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-4"
      aria-hidden
    >
      <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200 motion-reduce:animate-none animate-pulse" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-[60%] rounded bg-slate-200 motion-reduce:animate-none animate-pulse" />
        <div className="h-3 w-[80%] max-w-full rounded bg-slate-100 motion-reduce:animate-none animate-pulse" />
        <div className="h-2.5 w-1/3 max-w-full rounded bg-slate-100 motion-reduce:animate-none animate-pulse" />
      </div>
    </div>
  );
}

/**
 * 4 derniers inscrits (Firestore), secteur + besoin + date relative.
 * Requête : `users` triés par `createdAt` desc, `limit(4)`.
 */
export function RecentMembersActivity({ lang }: { lang: Language }) {
  const c = tcopy(lang);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(4)
        );
        const snap = await getDocs(q);
        if (cancel) return;
        setMembers(
          snap.docs.map((d) => {
            const data = d.data() as Omit<UserProfile, 'uid'>;
            return { ...data, uid: d.id } as UserProfile;
          })
        );
      } catch (e) {
        console.error(e);
        if (!cancel) {
          setFailed(true);
          setMembers([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const showEmpty = !loading && members.length === 0;

  if (failed) return null;

  return (
    <section
      className="recent-members-activity mt-10 print:break-inside-avoid"
      aria-labelledby="recent-members-activity-title"
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">
        <header className="mb-5 sm:mb-6">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:text-xs"
            style={{ color: BRAND }}
          >
            {c.eyebrow}
          </p>
          <h2
            id="recent-members-activity-title"
            className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
          >
            {c.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            {c.lead}
          </p>
        </header>

        {loading ? (
          <ul
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2"
            aria-busy="true"
          >
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i}>
                <CardSkeleton />
              </li>
            ))}
          </ul>
        ) : showEmpty ? (
          <p className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
            {c.empty}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2">
            {members.map((p) => (
              <li key={p.uid}>
                <CardRow
                  profile={p}
                  lang={lang}
                  sectorFallback={c.sectorFallback}
                />
              </li>
            ))}
          </ul>
        )}

        {!loading && (
          <div className="mt-5 border-t border-slate-100 pt-5 sm:mt-6 sm:pt-6">
            <p className="text-center text-sm text-slate-700 sm:text-left">
              {c.ctaLine}
            </p>
            <div className="mt-3 flex justify-center sm:justify-start print:justify-start">
              <Link
                to="/inscription"
                className="inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 sm:w-auto"
                style={{ background: BRAND }}
              >
                {c.cta}
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
