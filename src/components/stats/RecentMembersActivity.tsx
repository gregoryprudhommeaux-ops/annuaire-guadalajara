import React, { useEffect, useState } from 'react';
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
import { getStatsVitrineCopy } from '@/i18n/statsVitrine';
import { StatsCard, StatsSectionHeader, StatsSectionShell } from '@/components/stats/ui';

type SectorVisual = {
  Icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  iconColor: string;
};

const SECTOR_ATLAS: { test: (s: string) => boolean; v: SectorVisual }[] = [
  {
    test: (s) => /agriculture|agroaliment|aliment/i.test(s),
    v: { Icon: UtensilsCrossed, bgColor: 'bg-[#e6f5f5]/50', iconColor: 'text-[#01696f]' },
  },
  {
    test: (s) => /technolog|informatique|it\b/i.test(s),
    v: { Icon: Laptop, bgColor: 'bg-[#e6f5f5]/50', iconColor: 'text-[#01696f]' },
  },
  {
    test: (s) => /commerce|distribution|détail|retail|hôtell|restaur|tourisme/i.test(s),
    v: { Icon: Package, bgColor: 'bg-[#e6f5f5]/50', iconColor: 'text-[#01696f]' },
  },
  {
    test: (s) => /conseil|services aux entreprises|banque|finance|juridique/i.test(s),
    v: { Icon: Briefcase, bgColor: 'bg-[#e6f5f5]/50', iconColor: 'text-[#01696f]' },
  },
  {
    test: (s) => /industrie|manufactur|automobile|énergie|bâtiment|immobilier|santé/i.test(s),
    v: { Icon: Factory, bgColor: 'bg-[#e6f5f5]/50', iconColor: 'text-[#01696f]' },
  },
];

const SECTOR_DEFAULT: SectorVisual = {
  Icon: Building2,
  bgColor: 'bg-slate-50',
  iconColor: 'text-[#01696f]',
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
    <StatsCard className="!p-4 transition-shadow duration-200 motion-reduce:transition-none print:break-inside-avoid motion-safe:hover:shadow-md">
      <div className="flex items-start gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${bgColor}`}
        aria-hidden
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{sector}</p>
        <p className="text-xs text-slate-600">{need}</p>
        <p className="mt-1 text-xs text-slate-500">{when}</p>
      </div>
      </div>
    </StatsCard>
  );
}

function CardSkeleton() {
  return (
    <StatsCard className="!p-4" aria-hidden>
    <div
      className="flex items-start gap-3"
    >
      <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200 motion-reduce:animate-none animate-pulse" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-[60%] rounded bg-slate-200 motion-reduce:animate-none animate-pulse" />
        <div className="h-3 w-[80%] max-w-full rounded bg-slate-100 motion-reduce:animate-none animate-pulse" />
        <div className="h-2.5 w-1/3 max-w-full rounded bg-slate-100 motion-reduce:animate-none animate-pulse" />
      </div>
    </div>
    </StatsCard>
  );
}

/**
 * 4 derniers inscrits (Firestore), secteur + besoin + date relative.
 * Requête : `users` triés par `createdAt` desc, `limit(4)`.
 */
export function RecentMembersActivity({ lang }: { lang: Language }) {
  const c = getStatsVitrineCopy(lang).recentMembers;
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
      <StatsSectionShell>
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
          <StatsSectionHeader
            eyebrow={c.eyebrow}
            title={c.title}
            titleId="recent-members-activity-title"
            description={c.lead}
          />
        </div>
        <div className="p-4 sm:p-6">

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
          <p className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
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
        </div>
      </StatsSectionShell>
    </section>
  );
}
