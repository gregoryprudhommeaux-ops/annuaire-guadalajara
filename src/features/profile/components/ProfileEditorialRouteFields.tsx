import { useEffect, useMemo, useState } from 'react';
import type { Language, UserProfile } from '@/types';
import { pickLang } from '@/lib/uiLocale';
import { PROFILE_EDITORIAL_RULES } from '@/features/profile/utils/profileEditorialRules';
import {
  normalizeInlineText,
  normalizeTextareaText,
  rebuildKeywords,
} from '@/features/profile/utils/profileEditorialFormat';
import { SoftCharacterCounter } from '@/features/profile/components/SoftCharacterCounter';
import { FieldBadge } from '@/components/ui/FieldBadge';
import { PROFILE_FIELD_LABELS } from '@/features/profile/utils/profileFieldLabels';
import { cn } from '@/lib/cn';

type DraftTexts = Record<string, string> | undefined;

type TFn = (key: string) => string;

type Common = {
  formDraftT: DraftTexts;
  editingProfile: UserProfile | null;
  profile: UserProfile | null;
  profileEditFrUx: boolean;
  lang: Language;
  t: TFn;
};

export function ProfileEditorialMemberBioField({
  formDraftT,
  editingProfile,
  profile,
  profileEditFrUx,
  lang,
  t,
}: Common) {
  const rules = PROFILE_EDITORIAL_RULES.bio;
  const initial = useMemo(
    () =>
      formDraftT?.memberBio ??
      editingProfile?.memberBio ??
      profile?.memberBio ??
      editingProfile?.bio ??
      profile?.bio ??
      '',
    [
      formDraftT?.memberBio,
      editingProfile?.memberBio,
      profile?.memberBio,
      editingProfile?.bio,
      profile?.bio,
    ]
  );
  const [value, setValue] = useState(initial);
  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const placeholder = profileEditFrUx
    ? rules.placeholder
    : pickLang(
        'Qui êtes-vous, votre parcours, ce que vous apportez au réseau…',
        'Quién eres, tu trayectoria, qué aportas a la red…',
        'Who you are, your path, what you bring to the network…',
        lang
      );
  const help = profileEditFrUx ? rules.help : t('profileFormMemberBioHint');

  return (
    <div className="space-y-1">
      <label
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
        htmlFor="profile-member-bio"
      >
        {profileEditFrUx ? PROFILE_FIELD_LABELS.bio : t('memberBio')}
        <span className="text-red-500 font-semibold" aria-hidden>
          {' *'}
        </span>
      </label>
      <textarea
        id="profile-member-bio"
        name="memberBio"
        rows={4}
        maxLength={rules.max}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => {
          const raw = e.target.value;
          const next = normalizeTextareaText(raw);
          if (next !== raw) setValue(next);
        }}
        placeholder={placeholder}
        className="min-h-[90px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
      />
      <small className="field-help">{help}</small>
      <SoftCharacterCounter value={value} softMax={rules.softMax} hardMax={rules.max} />
    </div>
  );
}

export function ProfileEditorialNetworkGoalField({
  formDraftT,
  editingProfile,
  profile,
  profileEditFrUx,
  t,
}: Common) {
  const rules = PROFILE_EDITORIAL_RULES.lookingForText;
  const initial = useMemo(
    () =>
      formDraftT?.networkGoal ??
      (editingProfile?.networkGoal ?? profile?.networkGoal ?? ''),
    [formDraftT?.networkGoal, editingProfile?.networkGoal, profile?.networkGoal]
  );
  const [value, setValue] = useState(initial);
  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const placeholder = profileEditFrUx ? rules.placeholder : t('profileNetworkGoalPlaceholder');
  const help = profileEditFrUx ? rules.help : t('profileNetworkGoalHint');

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label htmlFor="networkGoal" className="text-sm font-semibold text-stone-900">
          {profileEditFrUx ? PROFILE_FIELD_LABELS.lookingForText : t('profileNetworkGoalLabel')}
        </label>
        <FieldBadge tone="recommended">{t('commonRecommended')}</FieldBadge>
      </div>
      <input
        id="networkGoal"
        name="networkGoal"
        type="text"
        maxLength={rules.max}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => {
          const raw = e.target.value;
          const next = normalizeInlineText(raw);
          if (next !== raw) setValue(next);
        }}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none ring-0 placeholder:text-stone-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25',
          'field-priority'
        )}
      />
      <small className="field-help">{help}</small>
      <SoftCharacterCounter value={value} softMax={rules.softMax} hardMax={rules.max} />
    </div>
  );
}

export function ProfileEditorialHelpNewcomersField({
  formDraftT,
  editingProfile,
  profile,
  profileEditFrUx,
  t,
}: Common) {
  const rules = PROFILE_EDITORIAL_RULES.helpOfferText;
  const initial = useMemo(
    () =>
      formDraftT?.helpNewcomers ??
      (editingProfile?.helpNewcomers ?? profile?.helpNewcomers ?? ''),
    [formDraftT?.helpNewcomers, editingProfile?.helpNewcomers, profile?.helpNewcomers]
  );
  const [value, setValue] = useState(initial);
  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const placeholder = profileEditFrUx ? rules.placeholder : t('profileHelpNewcomersPlaceholder');
  const help = profileEditFrUx ? rules.help : t('profileHelpNewcomersHint');

  return (
    <div className="space-y-1">
      <label
        htmlFor="helpNewcomers"
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
      >
        {profileEditFrUx ? PROFILE_FIELD_LABELS.helpOfferText : t('profileHelpNewcomersLabel')}
      </label>
      <textarea
        id="helpNewcomers"
        name="helpNewcomers"
        rows={3}
        maxLength={rules.max}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => {
          const raw = e.target.value;
          const next = normalizeTextareaText(raw);
          if (next !== raw) setValue(next);
        }}
        placeholder={placeholder}
        className={cn(
          'w-full min-h-[80px] rounded-lg border border-amber-200/80 bg-white px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-amber-600',
          'field-priority'
        )}
      />
      <small className="field-help">{help}</small>
      <SoftCharacterCounter value={value} softMax={rules.softMax} hardMax={rules.max} />
    </div>
  );
}

export function ProfileEditorialKeywordsField({
  formDraftT,
  editingProfile,
  profile,
  profileEditFrUx,
  t,
}: Common) {
  const rules = PROFILE_EDITORIAL_RULES.keywords;
  const editingSectors = (editingProfile?.targetSectors ?? []).join(',');
  const profileSectors = (profile?.targetSectors ?? []).join(',');
  const initial = useMemo(() => {
    const d = formDraftT?.targetSectors;
    if (typeof d === 'string' && d.trim() !== '') return d;
    return (editingProfile?.targetSectors || profile?.targetSectors || []).join(', ');
  }, [formDraftT?.targetSectors, editingSectors, profileSectors]);
  const [value, setValue] = useState(initial);
  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const placeholder = profileEditFrUx ? rules.placeholder : t('needKeywordsPlaceholder');
  const help = profileEditFrUx ? rules.help : t('needKeywordsHint');

  return (
    <div className="space-y-1">
      <label
        htmlFor="targetSectors-needs"
        className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
      >
        {profileEditFrUx ? PROFILE_FIELD_LABELS.keywords : t('profileFormAboutKeywordsLabel')}{' '}
        <span className="text-[10px] font-normal normal-case text-stone-400">
          {t('targetSectorsOptional')}
        </span>
      </label>
      <textarea
        id="targetSectors-needs"
        name="targetSectors"
        rows={2}
        maxLength={rules.max}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => {
          const raw = e.target.value;
          const next = rebuildKeywords(raw);
          if (next !== raw) setValue(next);
        }}
        placeholder={placeholder}
        className="min-h-[3.5rem] w-full resize-y rounded-lg border border-amber-200/80 bg-white px-3 py-2 text-sm leading-snug outline-none transition-all focus:ring-2 focus:ring-amber-600"
      />
      <small className="field-help">{help}</small>
      <SoftCharacterCounter value={value} softMax={rules.softMax} hardMax={rules.max} />
    </div>
  );
}
