import React from 'react';
import { ChevronRight, Linkedin } from 'lucide-react';
import { normalizedTargetKeywords, type Language, type UserProfile } from '../../types';
import { activityCategoryLabel, workFunctionLabel } from '../../constants';
import { needOptionLabel, sanitizeHighlightedNeeds } from '../../needOptions';
import { getPassionEmoji, getPassionLabel, sanitizePassionIds } from '../../lib/passionConfig';
import {
  sanitizeWorkingLanguageCodes,
  typicalClientSizeLabel,
  workingLanguageLabel,
} from '../../lib/contactPreferences';
import { pickLang } from '../../lib/uiLocale';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import {
  companyActivityNamesJoined,
  profileDistinctActivityCategories,
  normalizeProfileCompanyActivities,
  effectiveMemberBio,
  displayActivityDescriptionForSlot,
  effectiveTypicalClientSizesForProfile,
} from '../../lib/companyActivities';
import { cn } from '../../cn';
import AiTranslatedFreeText from '../AiTranslatedFreeText';
import {
  profileCardClass,
  profileNeedPillClass,
  profileNeutralPillClass,
  profileSectionTitleClass,
} from './profileSectionStyles';

function trimProfileWebsite(website: string | undefined | null): { href: string; label: string } | null {
  const w = website?.trim();
  if (!w) return null;
  const href = /^https?:\/\//i.test(w) ? w : `https://${w}`;
  const label = w.replace(/^https?:\/\//i, '');
  return { href, label };
}

export type MemberPublicProfileProps = {
  profile: UserProfile;
  lang: Language;
  t: (key: string) => string;
  canViewEmail: boolean;
  canViewWhatsapp: boolean;
  onViewNeed?: () => void;
};

export function MemberPublicProfile({
  profile,
  lang,
  t,
  canViewEmail,
  canViewWhatsapp,
  onViewNeed,
}: MemberPublicProfileProps) {
  const displayName = formatPersonName(profile.fullName);
  const location = [profile.city, profile.neighborhood, profile.state, profile.country]
    .filter(Boolean)
    .join(', ');

  const sectorCodes = profileDistinctActivityCategories(profile);
  const fonction = profile.positionCategory ? workFunctionLabel(profile.positionCategory, lang) : '';

  const metaParts = [fonction, location].filter(Boolean);
  const metaLine = metaParts.join(' · ');

  const needs = sanitizeHighlightedNeeds(profile.highlightedNeeds);
  const passions = sanitizePassionIds(profile.passionIds);
  const langs = sanitizeWorkingLanguageCodes(profile.workingLanguageCodes);
  const keywords = normalizedTargetKeywords(profile);
  const clientSizes = effectiveTypicalClientSizesForProfile(profile);

  const openToLabels: string[] = [];
  if (profile.openToMentoring) openToLabels.push(t('contactPrefsOpenMentoring'));
  if (profile.openToTalks) openToLabels.push(t('contactPrefsOpenTalks'));
  if (profile.openToEvents) openToLabels.push(t('contactPrefsOpenEvents'));

  const site = trimProfileWebsite(profile.website);
  const hasGoal = Boolean(profile.networkGoal?.trim());
  const hasNeeds = needs.length > 0;

  return (
    <article className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="inline-flex max-w-full flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            <span className="min-w-0 break-words">{displayName || profile.fullName}</span>
            {profile.linkedin?.trim() ? (
              <a
                href={
                  profile.linkedin.trim().startsWith('http')
                    ? profile.linkedin.trim()
                    : `https://${profile.linkedin.trim()}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[#0A66C2] transition-opacity hover:opacity-80"
                aria-label="LinkedIn"
              >
                <Linkedin className="size-[0.85em]" strokeWidth={2} aria-hidden />
              </a>
            ) : null}
          </h1>
          <p className="mt-1 text-lg font-medium text-stone-600">
            {companyActivityNamesJoined(profile) || profile.companyName}
          </p>
          {metaLine ? <p className="mt-1 text-xs text-stone-500">{metaLine}</p> : null}
          {sectorCodes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sectorCodes.map((code) => (
                <span
                  key={code}
                  className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700"
                >
                  {activityCategoryLabel(code, lang)}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {site ? (
            <a
              href={site.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
            >
              {t('website')}
            </a>
          ) : null}
          {profile.email && canViewEmail ? (
            <a
              href={`mailto:${profile.email}`}
              className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {t('cardContactByEmail')}
            </a>
          ) : null}
          {profile.whatsapp && canViewWhatsapp ? (
            <a
              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              {t('cardContactByWhatsapp')}
            </a>
          ) : null}
        </div>
      </header>

      {(hasGoal || hasNeeds) && (
        <section
          className={cn('grid gap-4', hasGoal && hasNeeds ? 'md:grid-cols-2' : 'md:grid-cols-1')}
        >
          {hasGoal ? (
            <div className={profileCardClass}>
              <h2 className={profileSectionTitleClass}>{t('profileNetworkGoalLabel')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-800">{profile.networkGoal}</p>
            </div>
          ) : null}

          {hasNeeds ? (
            <div className={profileCardClass}>
              <h2 className={profileSectionTitleClass}>{t('profilePublicCurrentNeeds')}</h2>
              <ul className="mt-2 flex list-none flex-wrap gap-1.5 p-0">
                {needs.map((id) => (
                  <li key={id} className={profileNeedPillClass}>
                    {needOptionLabel(id, lang)}
                  </li>
                ))}
              </ul>
              {onViewNeed ? (
                <button
                  type="button"
                  onClick={onViewNeed}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  {pickLang('Voir le besoin', 'Ver la necesidad', 'View need', lang)}
                  <ChevronRight size={14} aria-hidden />
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      )}

      {profile.helpNewcomers?.trim() ? (
        <section className={profileCardClass}>
          <h2 className={profileSectionTitleClass}>{t('profileHelpNewcomersLabel')}</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
            {profile.helpNewcomers}
          </p>
        </section>
      ) : null}

      {effectiveMemberBio(profile).trim() ? (
        <section>
          <h2 className={cn('mb-2', profileSectionTitleClass)}>{t('memberBio')}</h2>
          <AiTranslatedFreeText
            lang={lang}
            t={t}
            text={effectiveMemberBio(profile)}
            pretranslatedByLang={
              profile.memberBio?.trim() ? profile.memberBioTranslations : profile.bioTranslations
            }
            className="text-sm leading-relaxed text-stone-800"
            whitespace="pre-wrap"
          />
        </section>
      ) : null}

      {(() => {
        const slots = normalizeProfileCompanyActivities(profile);
        const blocks = slots
          .map((slot) => {
            const text = displayActivityDescriptionForSlot(slot);
            if (!text.trim() || !slot.companyName.trim()) return null;
            return { slot, text };
          })
          .filter(Boolean) as { slot: (typeof slots)[0]; text: string }[];
        if (blocks.length === 0) return null;
        return (
          <section className="space-y-4">
            <h2 className={profileSectionTitleClass}>{t('profileFormActivityDescriptionLabel')}</h2>
            {blocks.map(({ slot, text }) => (
              <div key={slot.id} className={profileCardClass}>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {slot.companyName.trim()}
                </p>
                <AiTranslatedFreeText
                  lang={lang}
                  t={t}
                  text={text}
                  className="mt-2 text-sm leading-relaxed text-stone-800"
                  whitespace="pre-wrap"
                />
              </div>
            ))}
          </section>
        );
      })()}

      {(passions.length > 0 || langs.length > 0) && (
        <section className="grid gap-4 md:grid-cols-2">
          {passions.length > 0 ? (
            <div>
              <h2 className={cn('mb-2', profileSectionTitleClass)}>{t('passions')}</h2>
              <div className="flex flex-wrap gap-1.5">
                {passions.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-800"
                  >
                    <span aria-hidden>{getPassionEmoji(id)}</span>
                    {getPassionLabel(id, lang)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {langs.length > 0 ? (
            <div>
              <h2 className={cn('mb-2', profileSectionTitleClass)}>{t('contactPrefsWorkingLangLabel')}</h2>
              <div className="flex flex-wrap gap-1.5">
                {langs.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-800"
                  >
                    {workingLanguageLabel(code, lang)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {(keywords.length > 0 || clientSizes.length > 0 || openToLabels.length > 0) && (
        <section className="space-y-3">
          {keywords.length > 0 ? (
            <div>
              <h2 className={cn('mb-2', profileSectionTitleClass)}>{t('targetSectors')}</h2>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((tag) => (
                  <span key={tag} className={profileNeutralPillClass}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {clientSizes.length > 0 ? (
            <div>
              <h2 className={cn('mb-2', profileSectionTitleClass)}>{t('contactPrefsClientSizeLabel')}</h2>
              <div className="flex flex-wrap gap-1.5">
                {clientSizes.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-800"
                  >
                    {typicalClientSizeLabel(v, lang)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {openToLabels.length > 0 ? (
            <div>
              <h2 className={cn('mb-2', profileSectionTitleClass)}>{t('contactPrefsOpenToLabel')}</h2>
              <div className="flex flex-wrap gap-1.5">
                {openToLabels.map((item) => (
                  <span key={item} className={profileNeutralPillClass}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </article>
  );
}
