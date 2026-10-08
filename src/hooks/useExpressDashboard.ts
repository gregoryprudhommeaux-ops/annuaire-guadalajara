import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { USER_ADMIN_PRIVATE_COLLECTION } from '@/lib/userAdminPrivate';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import { nationalityLabel } from '@/lib/nationalityOptions';
import type { Language } from '@/types';
import type { PeriodKey } from '@/hooks/useAdminStats';
import {
  countBy,
  fieldFillRate,
  quoteCards,
  signupsByDay,
  validationBreakdown,
  type ExpressMemberRow,
  type NameCount,
  type DayCount,
} from '@/lib/expressDashboardCompute';
import { canonicalizeCity } from '@/lib/canonicalizeCity';

function getStartDate(period: PeriodKey): Date | null {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (period === '90d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    return d;
  }
  return null;
}

function asLang(v: unknown): ExpressMemberRow['communicationLanguage'] {
  return v === 'fr' || v === 'es' || v === 'en' ? v : '';
}

export type ExpressDashboardData = {
  loading: boolean;
  error: string | null;
  totalAllTime: number;
  /** Toutes les inscriptions EXPRESS (sans filtre période). */
  allRows: ExpressMemberRow[];
  rows: ExpressMemberRow[];
  byCity: NameCount[];
  byNationality: NameCount[];
  byDay: DayCount[];
  byValidation: NameCount[];
  lookingForQuotes: Array<{ id: string; name: string; city: string; text: string }>;
  communityGapQuotes: Array<{ id: string; name: string; city: string; text: string }>;
  lookingForFillPct: number;
  communityGapFillPct: number;
  withWhatsapp: number;
  pendingCount: number;
};

const EMPTY: ExpressDashboardData = {
  loading: true,
  error: null,
  totalAllTime: 0,
  allRows: [],
  rows: [],
  byCity: [],
  byNationality: [],
  byDay: [],
  byValidation: [],
  lookingForQuotes: [],
  communityGapQuotes: [],
  lookingForFillPct: 0,
  communityGapFillPct: 0,
  withWhatsapp: 0,
  pendingCount: 0,
};

export function useExpressDashboard(period: PeriodKey, lang: Language): ExpressDashboardData {
  const [raw, setRaw] = useState<ExpressMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [usersSnap, privateSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, USER_ADMIN_PRIVATE_COLLECTION)),
        ]);
        const nationalityByUid = new Map<string, string>();
        privateSnap.docs.forEach((d) => {
          const n = String((d.data() as { nationality?: string }).nationality ?? '')
            .trim()
            .toUpperCase();
          if (n) nationalityByUid.set(d.id, n);
        });

        const rows: ExpressMemberRow[] = usersSnap.docs
          .map((d) => {
            const data = d.data() as Record<string, unknown>;
            if (data.onboardingSource !== 'express') return null;
            const createdAt =
              data.createdAt instanceof Timestamp
                ? data.createdAt
                : data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === 'function'
                  ? (data.createdAt as Timestamp)
                  : null;
            const nationalityCode = nationalityByUid.get(d.id) ?? '';
            return {
              id: d.id,
              fullName:
                formatPersonName(String(data.fullName ?? '').trim()) ||
                String(data.email ?? '').trim() ||
                d.id,
              email: String(data.email ?? '').trim().toLowerCase(),
              whatsapp: String(data.whatsapp ?? '').trim(),
              city: canonicalizeCity(String(data.city ?? '').trim()),
              companyName: String(data.companyName ?? '').trim(),
              lookingFor: String(data.lookingFor ?? data.networkGoal ?? '').trim(),
              communityGap: String(data.communityGap ?? data.helpNewcomers ?? '').trim(),
              mexicoArrivalNote: String(data.mexicoArrivalNote ?? '').trim(),
              nationality: nationalityCode
                ? nationalityLabel(nationalityCode, lang) || nationalityCode
                : '',
              isValidated: typeof data.isValidated === 'boolean' ? data.isValidated : null,
              needsAdminReview: data.needsAdminReview === true,
              createdAt,
              communicationLanguage: asLang(data.communicationLanguage),
            } satisfies ExpressMemberRow;
          })
          .filter((r): r is ExpressMemberRow => Boolean(r))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? 0;
            const tb = b.createdAt?.toMillis?.() ?? 0;
            return tb - ta;
          });

        if (!cancelled) {
          setRaw(rows);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setRaw([]);
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return useMemo(() => {
    if (loading) return { ...EMPTY, loading: true, error };
    if (error) return { ...EMPTY, loading: false, error };

    const start = getStartDate(period);
    const rows = !start
      ? raw
      : raw.filter((r) => {
          const d = r.createdAt?.toDate?.();
          return d ? d >= start : false;
        });

    const emptyCity =
      lang === 'es' ? 'Sin ciudad' : lang === 'en' ? 'No city' : 'Sans ville';
    const emptyNat =
      lang === 'es' ? 'Sin nacionalidad' : lang === 'en' ? 'No nationality' : 'Sans nationalité';
    const valLabels = {
      validated: lang === 'es' ? 'Validados' : lang === 'en' ? 'Validated' : 'Validés',
      pending: lang === 'es' ? 'En revisión' : lang === 'en' ? 'Pending review' : 'En revue',
      other: lang === 'es' ? 'Otros' : lang === 'en' ? 'Other' : 'Autres',
    };

    return {
      loading: false,
      error: null,
      totalAllTime: raw.length,
      allRows: raw,
      rows,
      byCity: countBy(rows, (r) => r.city, emptyCity),
      byNationality: countBy(rows, (r) => r.nationality, emptyNat),
      byDay: signupsByDay(rows),
      byValidation: validationBreakdown(rows, valLabels),
      lookingForQuotes: quoteCards(rows, 'lookingFor'),
      communityGapQuotes: quoteCards(rows, 'communityGap'),
      lookingForFillPct: fieldFillRate(rows, 'lookingFor'),
      communityGapFillPct: fieldFillRate(rows, 'communityGap'),
      withWhatsapp: rows.filter((r) => Boolean(r.whatsapp)).length,
      pendingCount: rows.filter((r) => r.isValidated === false || r.needsAdminReview).length,
    };
  }, [raw, period, lang, loading, error]);
}
