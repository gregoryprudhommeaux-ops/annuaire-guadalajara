import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { Language } from '@/types';
import type { UserProfile } from '@/types';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { db } from '@/firebase';
import {
  loadDashboardFirestoreData,
  userProfileToMemberExtended,
} from '@/lib/api';
import type { MemberExtended, MemberNeed } from '@/lib/communityMemberExtended';
import { mockNeeds } from '@/lib/communityMemberExtended';
import {
  filterNeedsSince,
  filterProfilesJoinedSince,
} from '@/lib/funFactData';
import { memberExtendedToExplorerMember } from '@/lib/vueEnsembleCompute';

type TFn = (key: string) => string;

export type DashboardPageProps = {
  lang: Language;
  t: TFn;
  registeredWithProfile: boolean;
  onUnlockRadar: () => void;
  user: User | null;
  className?: string;
  initialAdminTab?: 'overview' | 'profiles' | 'site' | 'events';
};

type SectionErrorBoundaryProps = {
  fallback: React.ReactNode;
  children: React.ReactNode;
};

type SectionErrorBoundaryState = { hasError: boolean };

class SectionErrorBoundary extends React.Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  declare props: SectionErrorBoundaryProps;
  state: SectionErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[DashboardPage] section render failed:', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const RadarChartsLazy = React.lazy(() => import('@/components/admin/RadarCharts'));
const VueEnsembleLazy = React.lazy(() => import('@/components/dashboard/VueEnsemble'));
const NeedsDashboardLazy = React.lazy(() =>
  import('@/components/dashboard/NeedsDashboard').then((m) => ({ default: m.NeedsDashboard }))
);
const ExplorerProfilsLazy = React.lazy(() => import('@/components/matching/ExplorerProfils'));

/**
 * Page tableau de bord (Vite/React). Équivalent client d’un fichier Next
 * `src/app/dashboard/page.tsx` : pas de Server Component — données chargées ici.
 *
 * Doit être rendu sous le `LanguageProvider` de l’app pour recevoir `t` et `lang`.
 */
export default function DashboardPage({
  lang,
  t,
  registeredWithProfile,
  onUnlockRadar,
  user,
  className,
  initialAdminTab,
}: DashboardPageProps) {
  const [profiles, setProfiles] = useState<UserProfile[] | null>(null);
  const [needs, setNeeds] = useState<MemberNeed[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ role?: 'user' | 'admin' } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!registeredWithProfile) {
      setProfiles(null);
      setNeeds(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    loadDashboardFirestoreData()
      .then(({ profiles: p, needs: n }) => {
        if (!cancelled) {
          setProfiles(p);
          setNeeds(n);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
          setProfiles([]);
          setNeeds([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [registeredWithProfile]);

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) {
      setProfile(null);
      return;
    }
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() as { role?: 'user' | 'admin' };
          setProfile(data);
        } else {
          setProfile(null);
        }
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const membersExtended = useMemo<MemberExtended[]>(
    () => (profiles ?? []).map(userProfileToMemberExtended),
    [profiles]
  );

  const explorerMembers = useMemo(
    () => membersExtended.map(memberExtendedToExplorerMember),
    [membersExtended]
  );

  const loading =
    lang === 'es' ? 'Cargando…' : lang === 'en' ? 'Loading…' : 'Chargement…';
  const isAdmin = profile?.role === 'admin' || user?.email === 'chinois2001@gmail.com';
  const mobileAdminOnly = isMobile && isAdmin;

  if (registeredWithProfile && profiles === null && !loadError) {
    return (
      <div className={className}>
        <p className="text-sm text-slate-500">{loading}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full flex-col gap-6 py-4 md:gap-8 md:py-6 ${className ?? ''}`}
    >
      {loadError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {loadError}
        </p>
      )}

      {isAdmin ? <AdminDashboard lang={lang} t={t} initialTab={initialAdminTab} /> : null}

      {!mobileAdminOnly && (
        <SectionErrorBoundary
          fallback={
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {lang === 'en'
                ? 'Unable to render this dashboard section.'
                : lang === 'es'
                  ? 'No se puede mostrar esta sección del panel.'
                  : 'Impossible d’afficher cette section du tableau de bord.'}
            </p>
          }
        >
          <React.Suspense
            fallback={
              <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500 shadow-sm">
                Chargement des graphiques…
              </div>
            }
          >
            <RadarChartsLazy profiles={profiles ?? []} />
          </React.Suspense>

          <React.Suspense
            fallback={
              <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500 shadow-sm">
                {loading}
              </div>
            }
          >
            <VueEnsembleLazy
              lang={lang}
              t={t}
              registeredWithProfile={registeredWithProfile}
              onUnlockRadar={onUnlockRadar}
              user={user}
              membersExtended={registeredWithProfile ? (membersExtended ?? []) : undefined}
              communityNeeds={registeredWithProfile ? (needs ?? mockNeeds) : undefined}
              includeNeedsDashboard={false}
            />
          </React.Suspense>
        </SectionErrorBoundary>
      )}

      {!mobileAdminOnly && registeredWithProfile && profiles !== null && (
        <SectionErrorBoundary
          fallback={
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {lang === 'en'
                ? 'Unable to render needs analytics section.'
                : lang === 'es'
                  ? 'No se puede mostrar la sección de analítica de necesidades.'
                  : 'Impossible d’afficher la section analytics des besoins.'}
            </p>
          }
        >
          <React.Suspense
            fallback={
              <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500 shadow-sm">
                {loading}
              </div>
            }
          >
            <NeedsDashboardLazy needs={needs ?? mockNeeds} members={membersExtended} lang={lang} t={t} />
          </React.Suspense>
        </SectionErrorBoundary>
      )}

      {!mobileAdminOnly && registeredWithProfile && profiles !== null && (
        <SectionErrorBoundary
          fallback={
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {lang === 'en'
                ? 'Unable to render profiles explorer section.'
                : lang === 'es'
                  ? 'No se puede mostrar la sección del explorador de perfiles.'
                  : 'Impossible d’afficher la section explorateur de profils.'}
            </p>
          }
        >
          <React.Suspense
            fallback={
              <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500 shadow-sm">
                {loading}
              </div>
            }
          >
            <ExplorerProfilsLazy members={explorerMembers} lang={lang} showPageHeader />
          </React.Suspense>
        </SectionErrorBoundary>
      )}
    </div>
  );
}
