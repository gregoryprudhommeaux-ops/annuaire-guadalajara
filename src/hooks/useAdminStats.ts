import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getProfileAiRecommendationReadiness, type UserProfile } from '../types';
import { profileDistinctActivityCategories } from '../lib/companyActivities';

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
  /** Score 0–100 (champs profil / matching IA). */
  avgProfileCompletionPct: number;
  medianProfileCompletionPct: number;
  completionHistogram: { label: string; count: number }[];
  profilesUpdatedInPeriod: number;
  validatedProfiles: number;
  pendingReviewProfiles: number;
  registrationsByDay: { date: string; count: number }[];
  eventCountsByType: { name: string; value: number }[];
  spaRouteTopPaths: { path: string; count: number }[];
  totalProfileViewEvents: number;
  totalSpaRouteEvents: number;
  searchEvents: number;
  filterEvents: number;
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

function rowToUserProfile(row: Record<string, unknown> & { id: string }): UserProfile {
  const { id, ...rest } = row;
  return { ...rest, uid: id } as UserProfile;
}

function profileReadinessPct(p: Record<string, unknown> & { id: string }): number {
  try {
    const v = Math.round(getProfileAiRecommendationReadiness(rowToUserProfile(p)) * 1000) / 10;
    return Math.min(100, Math.max(0, v));
  } catch {
    return 0;
  }
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
    avgProfileCompletionPct: 0,
    medianProfileCompletionPct: 0,
    completionHistogram: [],
    profilesUpdatedInPeriod: 0,
    validatedProfiles: 0,
    pendingReviewProfiles: 0,
    registrationsByDay: [],
    eventCountsByType: [],
    spaRouteTopPaths: [],
    totalProfileViewEvents: 0,
    totalSpaRouteEvents: 0,
    searchEvents: 0,
    filterEvents: 0,
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
        })) as Array<Record<string, unknown> & { id: string }>;

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

        let validatedProfiles = 0;
        let pendingReviewProfiles = 0;

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

          const sectors = profileDistinctActivityCategories(p as unknown as UserProfile);
          if (sectors.length === 0) {
            const fallback = (p.sector as string) || 'Autre';
            bySector[fallback] = (bySector[fallback] || 0) + 1;
          } else {
            sectors.forEach((code) => {
              bySector[code] = (bySector[code] || 0) + 1;
            });
          }

          const hasContact =
            !!(p.linkedin as string) ||
            !!(p.email as string) ||
            !!(p.whatsapp as string);
          if (!hasContact) incomplete++;

          if (p.isValidated === true) validatedProfiles++;
          if (p.needsAdminReview === true || p.isValidated === false) {
            pendingReviewProfiles++;
          }
        });

        const completionRate =
          allProfiles.length > 0
            ? Math.round(((allProfiles.length - incomplete) / allProfiles.length) * 100)
            : 0;

        const readinessScores = allProfiles.map((p) => profileReadinessPct(p));
        const avgProfileCompletionPct =
          readinessScores.length > 0
            ? Math.round((readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length) * 10) / 10
            : 0;
        const sortedReadiness = [...readinessScores].sort((a, b) => a - b);
        const mid = Math.floor(sortedReadiness.length / 2);
        const medianProfileCompletionPct =
          sortedReadiness.length === 0
            ? 0
            : sortedReadiness.length % 2 === 1
              ? sortedReadiness[mid]
              : Math.round(((sortedReadiness[mid - 1] + sortedReadiness[mid]) / 2) * 10) / 10;

        const buckets = [
          { label: '0–20%', count: 0 },
          { label: '21–40%', count: 0 },
          { label: '41–60%', count: 0 },
          { label: '61–80%', count: 0 },
          { label: '81–100%', count: 0 },
        ];
        readinessScores.forEach((s) => {
          if (s <= 20) buckets[0].count++;
          else if (s <= 40) buckets[1].count++;
          else if (s <= 60) buckets[2].count++;
          else if (s <= 80) buckets[3].count++;
          else buckets[4].count++;
        });
        const completionHistogram = buckets;

        const updateCutoff =
          startDate ??
          (() => {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return d;
          })();
        let profilesUpdatedInPeriod = 0;
        allProfiles.forEach((p) => {
          const ua = (p.updatedAt as Timestamp)?.toDate?.();
          if (ua && ua >= updateCutoff) profilesUpdatedInPeriod++;
        });

        const regByDay: Record<string, number> = {};
        allProfiles.forEach((p) => {
          const createdAt = (p.createdAt as Timestamp)?.toDate?.();
          if (!createdAt) return;
          if (startDate && createdAt < startDate) return;
          const key = createdAt.toISOString().split('T')[0];
          regByDay[key] = (regByDay[key] || 0) + 1;
        });
        const registrationsByDay = Object.keys(regByDay)
          .sort()
          .map((date) => ({ date, count: regByDay[date] }));

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
          console.warn('[useAdminStats] events_log read failed:', eventsErr);
          events = [];
        }

        let linkedin = 0;
        let email = 0;
        let whatsapp = 0;
        const viewCount: Record<string, { name: string; count: number }> = {};
        const contactCount: Record<string, { name: string; count: number }> = {};
        const typeCount: Record<string, number> = {};
        const spaPaths: Record<string, number> = {};
        let totalProfileViewEvents = 0;
        let totalSpaRouteEvents = 0;
        let searchEvents = 0;
        let filterEvents = 0;

        events.forEach((e) => {
          const type = e.eventType as string;
          typeCount[type] = (typeCount[type] || 0) + 1;

          if (type === 'click_linkedin') linkedin++;
          if (type === 'click_email') email++;
          if (type === 'click_whatsapp') whatsapp++;
          if (type === 'profile_view') totalProfileViewEvents++;
          if (type === 'spa_route') {
            totalSpaRouteEvents++;
            const meta = e.metadata as Record<string, unknown> | undefined;
            const path = typeof meta?.path === 'string' ? meta.path : '';
            if (path) spaPaths[path] = (spaPaths[path] || 0) + 1;
          }
          if (type === 'search') searchEvents++;
          if (type === 'filter_used') filterEvents++;

          const pid = (e.targetId as string) || (e.targetProfileId as string);
          const meta = e.metadata as Record<string, unknown> | undefined;
          const pname =
            (typeof meta?.profileName === 'string' && meta.profileName) ||
            (e.targetProfileName as string) ||
            pid;

          if (pid && type === 'profile_view') {
            if (!viewCount[pid]) viewCount[pid] = { name: pname || pid, count: 0 };
            viewCount[pid].count++;
          }
          if (
            pid &&
            ['click_linkedin', 'click_email', 'click_whatsapp'].includes(type)
          ) {
            if (!contactCount[pid]) contactCount[pid] = { name: pname || pid, count: 0 };
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

        const eventCountsByType = Object.entries(typeCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        const spaRouteTopPaths = Object.entries(spaPaths)
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);

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
            avgProfileCompletionPct,
            medianProfileCompletionPct,
            completionHistogram,
            profilesUpdatedInPeriod,
            validatedProfiles,
            pendingReviewProfiles,
            registrationsByDay,
            eventCountsByType,
            spaRouteTopPaths,
            totalProfileViewEvents,
            totalSpaRouteEvents,
            searchEvents,
            filterEvents,
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
    return () => {
      cancelled = true;
    };
  }, [period]);

  return stats;
}
