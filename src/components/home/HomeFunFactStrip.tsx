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
};

/** Cache module : deux instances (mobile + desktop) partagent une seule requête. */
let funFactCache: { lang: Language; members: MemberForFun[]; needs: NeedForFun[] } | null = null;

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
}: Props) {
  const [members, setMembers] = useState<MemberForFun[]>(() => funFactCache?.lang === lang ? funFactCache.members : []);
  const [needs, setNeeds] = useState<NeedForFun[]>(() => funFactCache?.lang === lang ? funFactCache.needs : []);

  useEffect(() => {
    let cancelled = false;
    if (funFactCache?.lang === lang) {
      setMembers(funFactCache.members);
      setNeeds(funFactCache.needs);
      return () => {
        cancelled = true;
      };
    }
    Promise.all([getNewMembersThisWeek(lang), getNeedsThisWeek()])
      .then(([m, n]) => {
        if (cancelled) return;
        funFactCache = { lang, members: m, needs: n };
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
  }, [lang]);

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
