import React, { useEffect, useState } from 'react';
import type { Language } from '@/types';
import type { MemberForFun, NeedForFun } from '@/lib/funFactData';
import FunFactCard from '@/components/FunFactCard';
import { getNewMembersThisWeek, getNeedsThisWeek } from '@/lib/api';

type Props = {
  lang: Language;
  className?: string;
  collapsibleOnMobile?: boolean;
  mobileShowLabel?: string;
  mobileHideLabel?: string;
  /**
   * `users` n’est lisible que pour les comptes connectés (Firestore).
   * À `false` : pas d’appel `getNewMembersThisWeek`, membres = [].
   */
  canLoadMemberProfiles?: boolean;
};

/** Cache module : deux instances (mobile + desktop) partagent une seule requête. */
let funFactCache: {
  lang: Language;
  members: MemberForFun[];
  needs: NeedForFun[];
  withMembers: boolean;
} | null = null;

/**
 * Équivalent Vite de l’`await getNewMembersThisWeek()` / `getNeedsThisWeek()` côté Next :
 * chargement client après montage (pas de RSC).
 */
export default function HomeFunFactStrip({
  lang,
  className,
  collapsibleOnMobile = false,
  mobileShowLabel,
  mobileHideLabel,
  canLoadMemberProfiles = true,
}: Props) {
  const [members, setMembers] = useState<MemberForFun[]>(() =>
    funFactCache?.lang === lang && funFactCache.withMembers === canLoadMemberProfiles ? funFactCache.members : []
  );
  const [needs, setNeeds] = useState<NeedForFun[]>(() =>
    funFactCache?.lang === lang && funFactCache.withMembers === canLoadMemberProfiles ? funFactCache.needs : []
  );

  useEffect(() => {
    let cancelled = false;
    if (funFactCache?.lang === lang && funFactCache.withMembers === canLoadMemberProfiles) {
      setMembers(funFactCache.members);
      setNeeds(funFactCache.needs);
      return () => {
        cancelled = true;
      };
    }
    const membersPromise = canLoadMemberProfiles
      ? getNewMembersThisWeek(lang)
      : Promise.resolve([] as MemberForFun[]);
    Promise.all([membersPromise, getNeedsThisWeek()])
      .then(([m, n]) => {
        if (cancelled) return;
        funFactCache = { lang, members: m, needs: n, withMembers: canLoadMemberProfiles };
        setMembers(m);
        setNeeds(n);
      })
      .catch(() => {
        if (!cancelled) {
          setMembers([]);
          setNeeds([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lang, canLoadMemberProfiles]);

  return (
    <FunFactCard
      lang={lang}
      members={members}
      needs={needs}
      className={className}
      collapsibleOnMobile={collapsibleOnMobile}
      mobileShowLabel={mobileShowLabel}
      mobileHideLabel={mobileHideLabel}
    />
  );
}
