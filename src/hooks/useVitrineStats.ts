import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import type { UserProfile } from '@/types';
import { profileDistinctActivityCategories } from '@/lib/companyActivities';
import { sanitizePassionIds } from '@/lib/passionConfig';
import { aggregateNeedsFromMembers, type NeedChartRow } from '@/lib/needs';
import { NEED_CATEGORY_LABELS } from '@/lib/needLabels';
import { NEED_OPTION_VALUE_SET, sanitizeHighlightedNeeds } from '@/needOptions';

export type VitrinePassionRow = {
  passionId: string;
  label: string;
  memberCount: number;
  sectorCount: number;
};

export type VitrineStats = {
  totalMembers: number;
  newMembersLast30d: number;
  prevNewMembers30d: number;
  profileViewsCumul: number;
  contactClicksCumul: number;
  potentialConnections: number;
  topSectors: { name: string; value: number }[];
  growthCumulative: { date: string; count: number }[];
  needs: NeedChartRow[];
  topPassions: VitrinePassionRow[];
  source: 'firestore' | 'computed';
  loading: boolean;
  error: string | null;
};

function rowToUserProfile(row: Record<string, unknown> & { id: string }): UserProfile {
  const { id, ...rest } = row;
  return { ...rest, uid: id } as UserProfile;
}

function getPublicOverride(): { path: string; id: string } {
  // Prefer a single canonical doc; keep an alias for older naming.
  return { path: 'public_vitrine', id: 'default' };
}

/**
 * Statistiques « vitrine » (agrégats uniquement) pour `/stats`.
 * 1) Si `public_vitrine/default` (ou `publicStats/summary`) existe, on fusionne ses champs sûrs.
 * 2) Sinon on calcule depuis `users` sans exposer d'emails (comptages / agrégations).
 */
export function useVitrineStats(): VitrineStats {
  const [state, setState] = useState<VitrineStats>({
    totalMembers: 0,
    newMembersLast30d: 0,
    prevNewMembers30d: 0,
    profileViewsCumul: 0,
    contactClicksCumul: 0,
    potentialConnections: 0,
    topSectors: [],
    growthCumulative: [],
    needs: [],
    topPassions: [],
    source: 'computed',
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: true, error: null }));
        }

        const now = new Date();
        const d30 = new Date(now);
        d30.setDate(d30.getDate() - 30);
        const d60 = new Date(now);
        d60.setDate(d60.getDate() - 60);
        const primary = getPublicOverride();
        const snapPrimary = await getDoc(doc(db, primary.path, primary.id)).catch(() => null);
        const snapAlias = await getDoc(doc(db, 'publicStats', 'summary')).catch(() => null);
        const publicDoc = snapPrimary?.exists() ? snapPrimary.data() : snapAlias?.exists() ? snapAlias.data() : null;

        const usersSnap = await getDocs(collection(db, 'users'));
        const rows = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as Array<
          Record<string, unknown> & { id: string }
        >;

        let totalMembers = rows.length;
        let newMembersLast30d = 0;
        let prevNewMembers30d = 0;
        const bySector: Record<string, number> = {};
        const regByDay: Record<string, number> = {};
        const passionToMembers = new Map<string, Set<string>>();
        const passionToSectors = new Map<string, Set<string>>();

        const membersForNeeds: Array<{ needs: Array<{ category: string; isActive: boolean }> }> = [];
        const highlightedToCategory = (id: string): string | null => {
          const key = String(id ?? '').trim().toUpperCase();
          if (!key) return null;
          if (key === 'NEED_PARTNERS') return 'partners';
          if (key === 'NEED_CLIENTS') return 'clients';
          if (key === 'NEED_DISTRIB') return 'distributors';
          if (key === 'NEED_SUPPLIERS') return 'suppliers';
          if (key === 'NEED_INVESTORS') return 'investors';
          if (key === 'NEED_HR') return 'talent';
          if (key === 'NEED_VISIBILITY') return 'visibility';
          if (key === 'NEED_MENTOR' || key === 'NEED_ECOSYSTEM' || key === 'NEED_RESEARCH') return 'experts';
          return 'other';
        };

        let profileViewsCumul = 0;
        let contactClicksCumul = 0;

        for (const p of rows) {
          const up = rowToUserProfile(p);
          const createdAt = (p.createdAt as Timestamp)?.toDate?.();
          if (createdAt) {
            if (createdAt >= d30) newMembersLast30d += 1;
            if (createdAt < d30 && createdAt >= d60) prevNewMembers30d += 1;
            const key = createdAt.toISOString().split('T')[0];
            regByDay[key] = (regByDay[key] || 0) + 1;
          }

          const sectors = profileDistinctActivityCategories(up);
          if (sectors.length === 0) {
            const fallback = String(up.activityCategory ?? (p as any).sector ?? '').trim() || '—';
            bySector[fallback] = (bySector[fallback] || 0) + 1;
          } else {
            sectors.forEach((s) => {
              bySector[s] = (bySector[s] || 0) + 1;
            });
          }

          const id = String(up.uid);
          const passions = sanitizePassionIds((up as any).passionIds);
          for (const pid of passions) {
            if (!passionToMembers.has(pid)) passionToMembers.set(pid, new Set());
            if (!passionToSectors.has(pid)) passionToSectors.set(pid, new Set());
            passionToMembers.get(pid)!.add(id);
            const sector = sectors[0] || String(up.activityCategory ?? '').trim() || '—';
            passionToSectors.get(pid)!.add(sector);
          }

          const needsIds = sanitizeHighlightedNeeds((up as any).highlightedNeeds).filter((x) =>
            NEED_OPTION_VALUE_SET.has(x)
          );
          if (needsIds.length) {
            const needs = needsIds
              .map((x) => highlightedToCategory(x))
              .filter((c): c is string => Boolean(c))
              .map((category) => ({ category, isActive: true }));
            membersForNeeds.push({ needs });
          }

          const v =
            Number((p as any).publicProfileViewCount ?? (p as any).profileViewCount ?? (p as any).profileViews ?? 0) ||
            0;
          const c =
            Number(
              (p as any).publicContactClickCount ?? (p as any).contactClickCount ?? (p as any).contactClicks ?? 0
            ) || 0;
          if (v > 0) profileViewsCumul += Math.max(0, Math.floor(v));
          if (c > 0) contactClicksCumul += Math.max(0, Math.floor(c));
        }

        // Courbe d'inscrits cumulés (tout historique)
        const sortedDays = Object.keys(regByDay).sort();
        let cumul = 0;
        const growthCumulative = sortedDays.map((date) => {
          cumul += regByDay[date] || 0;
          return { date, count: cumul };
        });

        const topSectors = Object.entries(bySector)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8);

        const topPassions: VitrinePassionRow[] = Array.from(passionToSectors.entries())
          .map(([passionId, sectors]) => ({
            passionId,
            label: passionId, // le UI remplacera par libellé + emoji côté page
            memberCount: passionToMembers.get(passionId)?.size ?? 0,
            sectorCount: sectors.size,
          }))
          .sort((a, b) => b.sectorCount - a.sectorCount || b.memberCount - a.memberCount)
          .slice(0, 5)
          .map((r) => r);

        const needs = aggregateNeedsFromMembers(
          membersForNeeds,
          NEED_CATEGORY_LABELS,
          { limit: 8 }
        );

        if (publicDoc && typeof publicDoc === 'object') {
          const d = publicDoc as Record<string, unknown>;
          const pickNum = (k: string) => (typeof d[k] === 'number' ? (d[k] as number) : Number(d[k]));
          if (Number.isFinite(pickNum('totalMembers'))) totalMembers = Math.max(0, Math.floor(pickNum('totalMembers')));
          if (Number.isFinite(pickNum('newMembersLast30d')))
            newMembersLast30d = Math.max(0, Math.floor(pickNum('newMembersLast30d')));
          if (Number.isFinite(pickNum('prevNewMembers30d')))
            prevNewMembers30d = Math.max(0, Math.floor(pickNum('prevNewMembers30d')));
          if (Number.isFinite(pickNum('profileViewsCumul'))) profileViewsCumul = Math.max(0, pickNum('profileViewsCumul'));
          if (Number.isFinite(pickNum('contactClicksCumul')))
            contactClicksCumul = Math.max(0, pickNum('contactClicksCumul'));
        }

        const n2 = totalMembers;
        const potentialConnections2 = n2 > 1 ? (n2 * (n2 - 1)) / 2 : 0;

        if (!cancelled) {
          setState({
            totalMembers: n2,
            newMembersLast30d,
            prevNewMembers30d,
            profileViewsCumul,
            contactClicksCumul,
            potentialConnections: potentialConnections2,
            topSectors,
            growthCumulative,
            needs,
            topPassions,
            source: publicDoc ? 'firestore' : 'computed',
            loading: false,
            error: null,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error && e.message ? e.message : 'Impossible de charger la vitrine.',
          }));
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
