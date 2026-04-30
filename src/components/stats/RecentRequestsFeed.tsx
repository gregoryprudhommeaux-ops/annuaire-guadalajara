import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  StatsBadge,
  StatsInsightCard,
  StatsPrimaryButton,
  StatsSecondaryButton,
  StatsSectionHeader,
  StatsSectionShell,
  statsListRowClassName,
} from '@/components/stats/ui';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { Briefcase, Handshake, MapPin, Package, Search, Clock3 } from 'lucide-react';
import { db } from '@/firebase';
import {
  formatPublicRequestLabel,
  getRequestFeedRelativeTime,
  isRequestNewish,
} from '@/lib/formatPublicMemberRequest';
import { mapMemberRequestDoc, MEMBER_REQUESTS_COLLECTION } from '@/lib/memberRequests';
import type { Language, MemberNetworkRequest } from '@/types';
import { getStatsVitrineCopy } from '@/i18n/statsVitrine';

function coalesceMs(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  const t = v as { toDate?: () => Date } | undefined;
  if (t && typeof t.toDate === 'function') {
    try {
      return t.toDate().getTime();
    } catch {
      return 0;
    }
  }
  return 0;
}

function toPublicRequest(
  id: string,
  data: Record<string, unknown>
): MemberNetworkRequest {
  const created = coalesceMs(data.createdAt) || coalesceMs((data as { created?: unknown }).created);
  const expires = coalesceMs(data.expiresAt);
  return mapMemberRequestDoc(id, {
    ...data,
    createdAt: created || 0,
    expiresAt: expires > 0 ? expires : 0,
  } as Record<string, unknown>);
}

function pickLineIcon(
  keywordSource: string
): React.ComponentType<{ className?: string }> {
  const s = keywordSource.toLowerCase();
  if (/(distribut|import|revend)/i.test(s)) return Package;
  if (/(fourni|sourcing|pack|emball)/i.test(s)) return Package;
  if (/(parten|commerc)/i.test(s)) return Handshake;
  if (/(fisc|fiscal|expert|jurid|mentor|conseil|prestata)/i.test(s)) return Briefcase;
  if (/(implant|implan|repres|soft)/i.test(s)) return MapPin;
  if (/(invest|finance|capital|crédit)/i.test(s)) return Search;
  return Search;
}

type RowProps = {
  r: MemberNetworkRequest;
  lang: Language;
  c: ReturnType<typeof getStatsVitrineCopy>['recentRequests'];
  index: number;
  onRequestClick?: (id: string) => void;
};

function RequestRow({ r, lang, c, index, onRequestClick }: RowProps) {
  const { line, main } = formatPublicRequestLabel(r, lang);
  const when = getRequestFeedRelativeTime(r.createdAt, lang);
  const isNew = isRequestNewish(r.createdAt);
  const Icon = pickLineIcon(`${main} ${r.sector} ${r.productOrService}`);

  const body = (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e6f5f5]/60 text-[#01696f]"
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug text-slate-900">{line}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:flex-col sm:items-end sm:gap-1">
        {isNew && <StatsBadge className="shrink-0">{c.badgeNew}</StatsBadge>}
        <p className="inline-flex items-center gap-1 text-right text-xs tabular-nums text-slate-500">
          <Clock3 className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
          {when}
        </p>
      </div>
    </div>
  );

  const liClass = `recent-req-row recent-req-row-anim block ${statsListRowClassName} text-left text-sm transition motion-safe:hover:border-slate-200 print:break-inside-avoid`;

  if (onRequestClick) {
    return (
      <li
        className={liClass}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <button
          type="button"
          className="m-0 w-full cursor-pointer p-0 text-left text-inherit"
          onClick={() => onRequestClick(r.id)}
        >
          {body}
        </button>
      </li>
    );
  }
  return (
    <li className={liClass} style={{ animationDelay: `${index * 50}ms` }}>
      <Link
        to="/requests"
        className="block w-full no-underline outline-offset-2 hover:opacity-95"
      >
        {body}
      </Link>
    </li>
  );
}

function RequestRowSkeleton() {
  return (
    <li className={`${statsListRowClassName} motion-reduce:animate-none`}>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-200 motion-reduce:animate-none animate-pulse" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-[90%] rounded bg-slate-200 motion-reduce:animate-none animate-pulse" />
          <div className="h-3 w-[45%] rounded bg-slate-100 motion-reduce:animate-none animate-pulse" />
        </div>
      </div>
    </li>
  );
}

/**
 * Cinq dernières demandes réseau (Firestore `member_requests`) affichées de façon **anonymisée**.
 * La requête cible l’**ordre public** connu du projet (pas de filtre `status` inexistant ici) :
 * `orderBy(createdAt desc)` + retrait des demandes expirées côté client.
 */
export function RecentRequestsFeed({
  lang,
  onRequestClick,
  hideBottomCta = false,
}: {
  lang: Language;
  onRequestClick?: (id: string) => void;
  hideBottomCta?: boolean;
}) {
  const c = getStatsVitrineCopy(lang).recentRequests;
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MemberNetworkRequest[]>([]);
  const [failed, setFailed] = useState(false);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const q = query(
          collection(db, MEMBER_REQUESTS_COLLECTION),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        if (cancel) return;
        const now = Date.now();
        const all = snap.docs
          .map((d) => toPublicRequest(d.id, d.data() as Record<string, unknown>))
          .filter((r) => r.expiresAt > now && r.createdAt > 0);
        setRows(all.slice(0, 5));
      } catch (e) {
        console.error(e);
        if (!cancel) {
          setFailed(true);
          setRows([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (failed) return null;

  const showEmpty = !loading && rows.length === 0;

  return (
    <section
      className={`recent-requests-feed mt-10 print:break-inside-avoid ${reveal ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 motion-reduce:opacity-100 motion-reduce:duration-0`}
      aria-labelledby="recent-requests-feed-title"
    >
      <StatsSectionShell>
        <div className="border-b border-slate-100 px-4 py-5 sm:px-6 sm:py-6">
          <StatsSectionHeader
            eyebrow={c.eyebrow}
            title={c.title}
            titleId="recent-requests-feed-title"
            description={c.lead}
            transition={
              <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {c.leadSecondary}
              </p>
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            {loading ? (
              <ul className="space-y-2" aria-busy="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <RequestRowSkeleton key={i} />
                ))}
              </ul>
            ) : showEmpty ? (
              <p className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
                {c.empty}
              </p>
            ) : (
              <ul className="space-y-2">
                {rows.map((r, i) => (
                  <RequestRow
                    key={r.id}
                    r={r}
                    lang={lang}
                    c={c}
                    index={i}
                    onRequestClick={onRequestClick}
                  />
                ))}
              </ul>
            )}
          </div>

          <aside className="min-h-0 border-t border-slate-100 pt-5 sm:pt-5 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <StatsInsightCard className="!shadow-none">
              <h3 className="text-sm font-extrabold text-slate-900">{c.whyTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.whyBody}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                {[c.b1, c.b2, c.b3].map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-[#01696f]" aria-hidden>
                      ·
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </StatsInsightCard>
          </aside>
        </div>

        {!hideBottomCta ? (
          <div className="border-t border-slate-100 px-4 py-5 sm:px-6">
            <p className="text-sm text-slate-700">{c.ctaLine}</p>
            <div className="mt-4 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-start print:flex-row">
              <StatsPrimaryButton to="/inscription" className="w-full sm:w-auto print:w-auto">
                {c.ctaPrimary}
              </StatsPrimaryButton>
              <StatsSecondaryButton to="/requests" className="w-full sm:w-auto print:w-auto">
                {c.ctaSecondary}
              </StatsSecondaryButton>
            </div>
          </div>
        ) : null}
      </StatsSectionShell>
    </section>
  );
}
