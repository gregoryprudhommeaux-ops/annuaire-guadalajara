import React, { useEffect, useState } from 'react';
import { getMembers } from '@/lib/api';
import type { ExplorerMember } from '@/lib/explorerProfilsCompute';
import type { Language } from '@/types';
import ExplorerProfils from '@/components/matching/ExplorerProfils';

type Props = {
  lang: Language;
  className?: string;
};

/**
 * Exemple d’intégration Vite/React : chargement Firestore puis rendu d’`ExplorerProfils`.
 * (Sur Next.js, sans Admin SDK, même pattern dans un composant client `"use client"`.)
 */
export default function ExplorerProfilsLoader({ lang, className }: Props) {
  const [members, setMembers] = useState<ExplorerMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getMembers()
      .then((rows) => {
        if (!cancelled) setMembers(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setMembers([]);
          setError(e instanceof Error ? e.message : String(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className={className}>
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      </div>
    );
  }

  if (members === null) {
    const loading =
      lang === 'es' ? 'Cargando…' : lang === 'en' ? 'Loading…' : 'Chargement…';
    return (
      <div className={className}>
        <p className="text-sm text-stone-500">{loading}</p>
      </div>
    );
  }

  return <ExplorerProfils members={members} lang={lang} className={className} />;
}
