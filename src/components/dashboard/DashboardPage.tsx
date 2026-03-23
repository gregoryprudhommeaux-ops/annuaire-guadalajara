import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { Language } from '@/types';
import type { UserProfile } from '@/types';
import ExplorerProfils from '@/components/matching/ExplorerProfils';
import VueEnsemble from '@/components/dashboard/VueEnsemble';
import { NeedsDashboard } from '@/components/dashboard/NeedsDashboard';
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
};

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
}: DashboardPageProps) {
  const [profiles, setProfiles] = useState<UserProfile[] | null>(null);
  const [needs, setNeeds] = useState<MemberNeed[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ role?: 'user' | 'admin' } | null>(null);

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

  if (registeredWithProfile && profiles === null && !loadError) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-500">{loading}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full flex-col gap-8 p-4 md:p-6 lg:p-8 ${className ?? ''}`}
    >
      {loadError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {loadError}
        </p>
      )}

      {isAdmin ? <AdminDashboard lang={lang} t={t} /> : null}

      <VueEnsemble
        lang={lang}
        t={t}
        registeredWithProfile={registeredWithProfile}
        onUnlockRadar={onUnlockRadar}
        user={user}
        membersExtended={registeredWithProfile ? (membersExtended ?? []) : undefined}
        communityNeeds={registeredWithProfile ? (needs ?? mockNeeds) : undefined}
        includeNeedsDashboard={false}
      />

      {registeredWithProfile && profiles !== null && (
        <NeedsDashboard
          needs={needs ?? mockNeeds}
          members={membersExtended}
          lang={lang}
          t={t}
        />
      )}

      {registeredWithProfile && profiles !== null && (
        <ExplorerProfils members={explorerMembers} lang={lang} showPageHeader />
      )}
    </div>
  );
}
