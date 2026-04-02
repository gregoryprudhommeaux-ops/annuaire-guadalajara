import React from 'react';
import { Link } from 'react-router-dom';
import { ProfileEmptyState } from '@/components/members/ProfileEmptyState';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/cn';

export type MemberCardMember = {
  fullName: string;
  bio?: string | null;
  currentNeeds?: string[] | null;
  /** Affichage optionnel sous le nom. */
  company?: string;
  sector?: string;
  /** Si défini, affiche le lien « Voir le profil ». */
  profileUid?: string;
};

export type MemberCardProps = {
  member: MemberCardMember;
  className?: string;
};

/**
 * Carte membre légère (aperçu) — pour grilles marketing ou maquettes.
 * L’annuaire principal utilise les cartes inline dans `App.tsx`.
 */
export function MemberCard({ member, className }: MemberCardProps) {
  const { t } = useTranslation();
  const hasBio = Boolean(member.bio && member.bio.trim().length > 0);
  const needs = (member.currentNeeds ?? []).filter(Boolean);
  const hasNeeds = needs.length > 0;

  return (
    <article
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-slate-900">{member.fullName}</h3>

      {member.company?.trim() ? (
        <p className="mt-1 text-sm text-slate-700">{member.company}</p>
      ) : null}

      {member.sector?.trim() ? (
        <p className="mt-1 text-sm text-slate-500">{member.sector}</p>
      ) : null}

      <div className="mt-3">
        {hasBio ? (
          <p className="text-sm leading-6 text-slate-700">{member.bio}</p>
        ) : (
          <ProfileEmptyState kind="generic" />
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {t('profilePublicCurrentNeeds')}
        </p>
        <div className="mt-2">
          {hasNeeds ? (
            <ul className="space-y-1">
              {needs.slice(0, 3).map((need) => (
                <li key={need} className="text-sm leading-6 text-slate-700">
                  {need}
                </li>
              ))}
            </ul>
          ) : (
            <ProfileEmptyState kind="needs" />
          )}
        </div>
      </div>

      {member.profileUid?.trim() ? (
        <div className="mt-4">
          <Link
            to={`/profil/${encodeURIComponent(member.profileUid.trim())}`}
            className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            {t('directoryMemberCardCta')}
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export default MemberCard;
