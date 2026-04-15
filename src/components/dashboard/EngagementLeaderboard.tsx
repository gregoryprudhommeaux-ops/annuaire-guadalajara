import React, { useMemo, useState } from 'react';
import type { Timestamp } from 'firebase/firestore';
import { HelpCircle } from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

export type MemberWithStats = {
  id: string;
  nom: string;
  photo?: string;
  entreprise?: string;
  secteur?: string;
  description?: string;
  contactClicks: number;
  lastLoginAt?: Timestamp;
  links?: string[];
  createdAt: Timestamp;
  /** optionnel: complet strict (nom+secteur+desc+photo) */
  isComplete?: boolean;
};

export function calculateEngagementScore(m: MemberWithStats): number {
  const nameOk = Boolean(String(m.nom ?? '').trim());
  const sectorOk = Boolean(String(m.secteur ?? '').trim());
  const photoOk = Boolean(String(m.photo ?? '').trim());
  const desc = String(m.description ?? '').trim();
  const descOk50 = desc.length >= 50;
  const complete = m.isComplete ?? (nameOk && sectorOk && photoOk && desc.length >= 30);

  let score = 0;
  if (complete) score += 30;
  if (photoOk) score += 20;
  if (descOk50) score += 15;
  if (sectorOk) score += 5;
  const hasLink = (m.links ?? []).some((l) => String(l ?? '').trim());
  if (hasLink) score += 5;

  const clicks = Math.max(0, Number(m.contactClicks ?? 0) || 0);
  if (clicks >= 1) score += 10;
  score += Math.min(10, Math.max(0, clicks - 1) * 2);

  const lastLogin = m.lastLoginAt?.toDate?.();
  if (lastLogin) {
    const days = (Date.now() - lastLogin.getTime()) / (24 * 3600 * 1000);
    if (days <= 30) score += 15;
  }

  return Math.max(0, Math.min(100, score));
}

export function getMemberLevel(score: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (score >= 80) return 'platinum';
  if (score >= 60) return 'gold';
  if (score >= 40) return 'silver';
  return 'bronze';
}

function scoreColor(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-400';
}

function rankLabel(i: number) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return String(i + 1);
}

export default function EngagementLeaderboard({ members }: { members: MemberWithStats[] }) {
  const [open, setOpen] = useState(false);
  const scored = useMemo(() => {
    const rows = (members ?? []).map((m) => {
      const score = calculateEngagementScore(m);
      return { ...m, score };
    });
    rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [members]);

  const top5 = scored.slice(0, 5);
  const avg = useMemo(() => {
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length);
  }, [scored]);

  if ((members?.length ?? 0) < 2) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-900">🏆 Membres les plus actifs</h3>
        <p className="mt-3 text-sm text-stone-500">Pas encore assez de membres pour le classement</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">🏆 Membres les plus actifs</h3>
          <p className="mt-1 text-xs text-stone-500">Top 5</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"
          aria-label="Voir la méthode de score"
          title="Voir la méthode de score"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {open ? (
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
          Score (max 100) : profil complet (+30), photo (+20), bio ≥50 (+15), clics contact (+10 +2/clic, max +10), connexion 30j (+15), secteur (+5), lien (+5).
        </div>
      ) : null}

      <div className="mt-3 space-y-3">
        {top5.map((m, i) => (
          <div key={m.id} className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-700">
              {rankLabel(i)}
            </span>
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-indigo-100 text-indigo-700">
              <ProfileAvatar
                photoURL={m.photo}
                fullName={m.nom}
                className="h-full w-full bg-indigo-100"
                initialsClassName="text-xs text-indigo-800"
                iconSize={18}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-900">{m.nom}</p>
              <p className="truncate text-xs text-stone-500">{m.entreprise ?? '—'}</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div className={`h-full ${scoreColor(m.score)}`} style={{ width: `${m.score}%` }} />
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-800">
              {m.score} pts
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs italic text-stone-500">Score moyen de la communauté : {avg} pts</p>
    </div>
  );
}

