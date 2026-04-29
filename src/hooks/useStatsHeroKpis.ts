import { useEffect, useState } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { MEMBER_REQUESTS_COLLECTION } from '@/lib/memberRequests';
import { profileDistinctActivityCategories } from '@/lib/companyActivities';
import type { UserProfile } from '@/types';
import { isAdminProfileLike } from '@/lib/isAdminProfile';

function toDateMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (v instanceof Timestamp) {
    return v.toMillis();
  }
  const t = (v as { toDate?: () => Date })?.toDate;
  if (typeof t === 'function') {
    const d = t.call(v);
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : null;
  }
  return null;
}

function rowToUserProfile(id: string, data: Record<string, unknown>): UserProfile {
  return { ...data, uid: id } as UserProfile;
}

function isMemberRequestOpen(data: Record<string, unknown>, nowMs: number): boolean {
  const st = String(data.status ?? '').toLowerCase();
  if (st === 'closed' || st === 'archived' || st === 'cancelled') return false;
  if (st === 'open') return true;
  const ex = data.expiresAt;
  if (typeof ex === 'number' && ex > 0) return ex > nowMs;
  return true;
}

export type StatsHeroKpiData = {
  members: number;
  openOpportunities: number;
  /** Variation en % par rapport au mois civil précédent (signée). */
  monthOverMonthGrowthPct: number;
  /** Nombre de secteurs d’activité distincts (profils). */
  distinctSectors: number;
};

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: StatsHeroKpiData };

const initial: LoadState = { status: 'loading' };

/**
 * Agrégats Firestore pour la section hero /stats (users + member_requests).
 */
export function useStatsHeroKpis(): LoadState {
  const [state, setState] = useState<LoadState>(initial);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!cancelled) setState({ status: 'loading' });
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const startThisMonth = new Date(y, m, 1, 0, 0, 0, 0);
        const startPrevMonth = new Date(y, m - 1, 1, 0, 0, 0, 0);
        const startThisMs = startThisMonth.getTime();
        const startPrevMs = startPrevMonth.getTime();
        const nowMs = now.getTime();

        const [usersSnap, reqSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, MEMBER_REQUESTS_COLLECTION)).catch(() => null),
        ]);

        const sectorSet = new Set<string>();
        let members = 0;
        let thisMonth = 0;
        let lastMonth = 0;

        for (const d of usersSnap.docs) {
          const raw = d.data() as Record<string, unknown>;
          const p = rowToUserProfile(d.id, raw);
          if (isAdminProfileLike(p)) continue;
          members += 1;
          const created = toDateMs(raw.createdAt);
          if (created != null) {
            if (created >= startThisMs && created <= nowMs) thisMonth += 1;
            if (created >= startPrevMs && created < startThisMs) lastMonth += 1;
          }
          const cats = profileDistinctActivityCategories(p);
          for (const c of cats) {
            const t = c.trim();
            if (t && t !== '—') sectorSet.add(t);
          }
          const ind = String((raw as { industry?: string }).industry ?? '').trim();
          if (ind) sectorSet.add(ind);
        }

        let openOpportunities = 0;
        if (reqSnap) {
          for (const doc of reqSnap.docs) {
            const data = doc.data() as Record<string, unknown>;
            if (isMemberRequestOpen(data, nowMs)) openOpportunities += 1;
          }
        }

        const monthOverMonthGrowthPct =
          lastMonth === 0 ? (thisMonth > 0 ? 100 : 0) : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
        const distinctSectors = sectorSet.size;

        if (!cancelled) {
          setState({
            status: 'ready',
            data: {
              members,
              openOpportunities,
              monthOverMonthGrowthPct,
              distinctSectors,
            },
          });
        }
      } catch (e) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
