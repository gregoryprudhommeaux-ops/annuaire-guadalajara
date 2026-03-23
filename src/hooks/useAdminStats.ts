import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export type PeriodKey = 'today' | 'week' | 'month' | 'all';

export interface ProfileStat {
  id: string;
  name: string;
  clickCount: number;
}

export interface AdminStats {
  totalProfiles: number;
  newProfilesInPeriod: number;
  profilesByType: { entreprise: number; membre: number };
  profilesByStatus: Record<string, number>;
  profilesByLanguage: Record<string, number>;
  profilesByCity: Record<string, number>;
  profilesBySector: Record<string, number>;
  completionRate: number;
  incompleteProfiles: number;
  growthCurve: { date: string; count: number }[];
  clickLinkedin: number;
  clickEmail: number;
  clickWhatsapp: number;
  totalClicks: number;
  clicksByType: { name: string; value: number }[];
  topViewedProfiles: ProfileStat[];
  topContactedProfiles: ProfileStat[];
  profilesNeverUpdated: number;
  loading: boolean;
  error: string | null;
}

function getStartDate(period: PeriodKey): Date | null {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'month') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  return null;
}

export function useAdminStats(period: PeriodKey): AdminStats {
  const [stats, setStats] = useState<AdminStats>({
    totalProfiles: 0,
    newProfilesInPeriod: 0,
    profilesByType: { entreprise: 0, membre: 0 },
    profilesByStatus: {},
    profilesByLanguage: {},
    profilesByCity: {},
    profilesBySector: {},
    completionRate: 0,
    incompleteProfiles: 0,
    growthCurve: [],
    clickLinkedin: 0,
    clickEmail: 0,
    clickWhatsapp: 0,
    totalClicks: 0,
    clicksByType: [],
    topViewedProfiles: [],
    topContactedProfiles: [],
    profilesNeverUpdated: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        if (!cancelled) {
          setStats((prev) => ({ ...prev, loading: true, error: null }));
        }
        const profilesSnap = await getDocs(collection(db, 'users'));
        const allProfiles = profilesSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        }));

        const startDate = getStartDate(period);

        const newInPeriod = allProfiles.filter((p) => {
          if (!startDate) return true;
          const createdAt = (p.createdAt as Timestamp)?.toDate?.();
          return createdAt && createdAt >= startDate;
        }).length;

        const byType = { entreprise: 0, membre: 0 };
        const byStatus: Record<string, number> = {};
        const byLanguage: Record<string, number> = {};
        const byCity: Record<string, number> = {};
        const bySector: Record<string, number> = {};
        let incomplete = 0;

        allProfiles.forEach((p: Record<string, unknown>) => {
          const t = (p.type as string) || 'membre';
          if (t === 'entreprise') byType.entreprise++;
          else byType.membre++;

          const st = (p.status as string) || 'Inconnu';
          byStatus[st] = (byStatus[st] || 0) + 1;

          const langs = (p.languages as string[]) || [];
          langs.forEach((l) => {
            byLanguage[l] = (byLanguage[l] || 0) + 1;
          });

          const city = (p.city as string) || 'Autre';
          byCity[city] = (byCity[city] || 0) + 1;

          const sector = (p.activityCategory as string) || (p.sector as string) || 'Autre';
          bySector[sector] = (bySector[sector] || 0) + 1;

          const hasContact =
            !!(p.linkedin as string) ||
            !!(p.email as string) ||
            !!(p.whatsapp as string);
          if (!hasContact) incomplete++;
        });

        const completionRate =
          allProfiles.length > 0
            ? Math.round(
                ((allProfiles.length - incomplete) / allProfiles.length) * 100
              )
            : 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const growthMap: Record<string, number> = {};
        allProfiles.forEach((p: Record<string, unknown>) => {
          const createdAt = (p.createdAt as Timestamp)?.toDate?.();
          if (createdAt && createdAt >= thirtyDaysAgo) {
            const key = createdAt.toISOString().split('T')[0];
            growthMap[key] = (growthMap[key] || 0) + 1;
          }
        });
        const sortedDays = Object.keys(growthMap).sort();
        let cumul = allProfiles.filter((p: Record<string, unknown>) => {
          const createdAt = (p.createdAt as Timestamp)?.toDate?.();
          return createdAt && createdAt < thirtyDaysAgo;
        }).length;
        const growthCurve = sortedDays.map((date) => {
          cumul += growthMap[date];
          return { date, count: cumul };
        });

        const neverUpdated = allProfiles.filter((p: Record<string, unknown>) => {
          const ca = (p.createdAt as Timestamp)?.seconds;
          const ua = (p.updatedAt as Timestamp)?.seconds;
          return !ua || Math.abs((ua || 0) - (ca || 0)) < 60;
        }).length;

        let events: Record<string, unknown>[] = [];
        try {
          let eventsQuery;
          if (startDate) {
            eventsQuery = query(
              collection(db, 'events_log'),
              where('createdAt', '>=', Timestamp.fromDate(startDate))
            );
          } else {
            eventsQuery = query(collection(db, 'events_log'));
          }
          const eventsSnap = await getDocs(eventsQuery);
          events = eventsSnap.docs.map((d) => d.data() as Record<string, unknown>);
        } catch (eventsErr) {
          // Non bloquant : le dashboard reste utile même sans accès events_log.
          console.warn('[useAdminStats] events_log read failed:', eventsErr);
          events = [];
        }

        let linkedin = 0;
        let email = 0;
        let whatsapp = 0;
        const viewCount: Record<string, { name: string; count: number }> = {};
        const contactCount: Record<string, { name: string; count: number }> = {};

        events.forEach((e) => {
          const type = e.eventType as string;
          if (type === 'click_linkedin') linkedin++;
          if (type === 'click_email') email++;
          if (type === 'click_whatsapp') whatsapp++;

          const pid = e.targetProfileId as string;
          const pname = (e.targetProfileName as string) || pid;

          if (pid && type === 'profile_view') {
            if (!viewCount[pid]) viewCount[pid] = { name: pname, count: 0 };
            viewCount[pid].count++;
          }
          if (
            pid &&
            ['click_linkedin', 'click_email', 'click_whatsapp'].includes(type)
          ) {
            if (!contactCount[pid]) contactCount[pid] = { name: pname, count: 0 };
            contactCount[pid].count++;
          }
        });

        const topViewed = Object.entries(viewCount)
          .map(([id, v]) => ({ id, name: v.name, clickCount: v.count }))
          .sort((a, b) => b.clickCount - a.clickCount)
          .slice(0, 5);

        const topContacted = Object.entries(contactCount)
          .map(([id, v]) => ({ id, name: v.name, clickCount: v.count }))
          .sort((a, b) => b.clickCount - a.clickCount)
          .slice(0, 5);

        if (!cancelled) {
          setStats({
            totalProfiles: allProfiles.length,
            newProfilesInPeriod: newInPeriod,
            profilesByType: byType,
            profilesByStatus: byStatus,
            profilesByLanguage: byLanguage,
            profilesByCity: byCity,
            profilesBySector: bySector,
            completionRate,
            incompleteProfiles: incomplete,
            growthCurve,
            clickLinkedin: linkedin,
            clickEmail: email,
            clickWhatsapp: whatsapp,
            totalClicks: linkedin + email + whatsapp,
            clicksByType: [
              { name: 'LinkedIn', value: linkedin },
              { name: 'Email', value: email },
              { name: 'WhatsApp', value: whatsapp },
            ],
            topViewedProfiles: topViewed,
            topContactedProfiles: topContacted,
            profilesNeverUpdated: neverUpdated,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setStats((prev) => ({
            ...prev,
            loading: false,
            error:
              err instanceof Error && err.message
                ? `Erreur lors du chargement des stats: ${err.message}`
                : 'Erreur lors du chargement des stats.',
          }));
        }
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [period]);

  return stats;
}

