import React, { useEffect, useState } from 'react';
import type { Language } from '@/types';
import type { MemberForFun, NeedForFun } from '@/lib/funFactData';
import FunFactCard from '@/components/FunFactCard';
import { getNewMembersThisWeek, getNeedsThisWeek } from '@/lib/api';

type Props = {
  lang: Language;
  className?: string;
};

/**
 * Équivalent Vite de l’`await getNewMembersThisWeek()` / `getNeedsThisWeek()` côté Next :
 * chargement client après montage (pas de RSC).
 */
export default function HomeFunFactStrip({ lang, className }: Props) {
  const [members, setMembers] = useState<MemberForFun[]>([]);
  const [needs, setNeeds] = useState<NeedForFun[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getNewMembersThisWeek(lang), getNeedsThisWeek()])
      .then(([m, n]) => {
        if (!cancelled) {
          setMembers(m);
          setNeeds(n);
        }
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
    />
  );
}
