import { cn } from '@/lib/cn';
import type { Language, UserProfile } from '@/types';
import { pickLang } from '@/lib/uiLocale';
import { NEED_OPTIONS } from '@/needOptions';
import { ProfileSectionTag } from '@/features/profile/components/ProfileSectionTag';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';
import { FieldBadge } from '@/components/ui/FieldBadge';
import {
  ProfileEditorialContactPreferenceField,
  ProfileEditorialHelpNewcomersField,
  ProfileEditorialKeywordsField,
  ProfileEditorialNetworkGoalField,
} from '@/features/profile/components/ProfileEditorialRouteFields';
import { PROFILE_FIELD_LABELS } from '@/features/profile/utils/profileFieldLabels';
import { PROFILE_FIELD_HELP } from '@/features/profile/utils/profileFieldHelp';

type DraftTexts = Record<string, string> | undefined;
type TFn = (key: string) => string;

export type ProfileMatchingSectionProps = {
  lang: Language;
  t: TFn;
  pickLang: typeof pickLang;
  profileEditFrUx: boolean;
  isEditProfileRoute: boolean;
  formDraftT: DraftTexts;
  editingProfile: UserProfile | null;
  profile: UserProfile | null;
  highlightedNeedsDraft: string[];
  onToggleHighlightedNeed: (id: string) => void;
  className?: string;
};

/**
 * Bloc « Ce que vous cherchez et ce que vous pouvez apporter » — champs clés pour recommandations / matching.
 * Rendu sur `/profile/edit` et parcours profil standard (hors route éditoriale FR).
 */
export function ProfileMatchingSection({
  lang,
  t,
  pickLang,
  profileEditFrUx,
  isEditProfileRoute,
  formDraftT,
  editingProfile,
  profile,
  highlightedNeedsDraft,
  onToggleHighlightedNeed,
  className,
}: ProfileMatchingSectionProps) {
  const bannerTitle = t('profileFormRecommendPriorityBannerTitle');
  const bannerBody = t('profileFormRecommendPriorityBannerBody');

  return (
    <section
      className={cn(
        'space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 sm:space-y-5 sm:p-5',
        isEditProfileRoute && 'profile-stack-md',
        className
      )}
      aria-labelledby="profile-matching-section-heading"
    >
      <div className="profile-section-header">
        <h2
          id="profile-matching-section-heading"
          className="m-0 min-w-0 text-base font-semibold tracking-tight text-slate-900 sm:text-[0.95rem]"
        >
          {t('profileFormSectionCore')}
        </h2>
        <ProfileSectionTag
          tone="matching"
          label={pickLang(
            'Important pour le matching',
            'Importante para el emparejamiento',
            'Used for matching',
            lang
          )}
        />
      </div>

      <div
        role="region"
        aria-label={bannerTitle}
        className="rounded-lg border border-slate-200 bg-slate-50/95 px-4 py-3 sm:px-5 sm:py-4"
      >
        <h3 className="text-sm font-semibold leading-snug text-slate-900">{bannerTitle}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-700">{bannerBody}</p>
      </div>

      <div className="space-y-5">
        {isEditProfileRoute ? (
          <ProfileEditorialNetworkGoalField
            formDraftT={formDraftT}
            editingProfile={editingProfile}
            profile={profile}
            profileEditFrUx={profileEditFrUx}
            lang={lang}
            t={t}
          />
        ) : (
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
              maxLength={200}
              defaultValue={
                formDraftT?.networkGoal ?? (editingProfile?.networkGoal ?? profile?.networkGoal) ?? ''
              }
              placeholder={t('profileNetworkGoalPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/25"
            />
            <ProfileFieldHint>
              {profileEditFrUx ? PROFILE_FIELD_HELP.lookingForText : t('profileNetworkGoalHint')}
            </ProfileFieldHint>
          </div>
        )}

        <div id="profile-completion-highlightedNeeds">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {profileEditFrUx ? PROFILE_FIELD_LABELS.currentNeeds : t('highlightedNeedsTitle')}{' '}
            <span className="text-[10px] font-normal normal-case text-slate-400">
              {t('highlightedNeedsOptional')}
            </span>
          </label>
          <div className="space-y-2">
            {NEED_OPTIONS.map((group) => (
              <div key={group.label.fr} className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {group.label[lang]}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.options.map((opt) => {
                    const selected = highlightedNeedsDraft.includes(opt.value);
                    const disabled = !selected && highlightedNeedsDraft.length >= 3;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onToggleHighlightedNeed(opt.value)}
                        disabled={disabled}
                        className={cn(
                          'w-full rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-all',
                          selected
                            ? 'border-amber-600 bg-amber-700 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                          disabled && !selected && 'cursor-not-allowed opacity-40 hover:border-slate-200'
                        )}
                      >
                        {opt.label[lang]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <ProfileFieldHint>
            {profileEditFrUx ? PROFILE_FIELD_HELP.currentNeeds : t('highlightedNeedsHint')}
          </ProfileFieldHint>
        </div>

        {isEditProfileRoute ? (
          <ProfileEditorialHelpNewcomersField
            formDraftT={formDraftT}
            editingProfile={editingProfile}
            profile={profile}
            profileEditFrUx={profileEditFrUx}
            lang={lang}
            t={t}
          />
        ) : (
          <div className="space-y-1">
            <label
              htmlFor="helpNewcomers"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
            >
              {profileEditFrUx ? PROFILE_FIELD_LABELS.helpOfferText : t('profileHelpNewcomersLabel')}
            </label>
            <textarea
              id="helpNewcomers"
              name="helpNewcomers"
              rows={3}
              maxLength={800}
              defaultValue={
                formDraftT?.helpNewcomers ?? (editingProfile?.helpNewcomers ?? profile?.helpNewcomers) ?? ''
              }
              placeholder={t('profileHelpNewcomersPlaceholder')}
              className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-slate-400/40"
            />
            <ProfileFieldHint>
              {profileEditFrUx ? PROFILE_FIELD_HELP.helpOfferText : t('profileHelpNewcomersHint')}
            </ProfileFieldHint>
          </div>
        )}

        {isEditProfileRoute ? (
          <ProfileEditorialContactPreferenceField
            formDraftT={formDraftT}
            editingProfile={editingProfile}
            profile={profile}
            profileEditFrUx={profileEditFrUx}
            lang={lang}
            t={t}
          />
        ) : (
          <div className="space-y-1">
            <label
              htmlFor="contactPreferenceCta"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
            >
              {profileEditFrUx ? PROFILE_FIELD_LABELS.preferredContactText : t('contactPrefsCtaLabel')}
            </label>
            <textarea
              id="contactPreferenceCta"
              name="contactPreferenceCta"
              rows={3}
              maxLength={200}
              defaultValue={
                formDraftT?.contactPreferenceCta ??
                (editingProfile?.contactPreferenceCta ?? profile?.contactPreferenceCta) ??
                ''
              }
              placeholder={t('contactPrefsCtaPlaceholder')}
              className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-slate-400/40"
            />
            <ProfileFieldHint>
              {profileEditFrUx ? PROFILE_FIELD_HELP.preferredContactText : t('contactPrefsCtaHint')}
            </ProfileFieldHint>
          </div>
        )}

        {isEditProfileRoute ? (
          <ProfileEditorialKeywordsField
            formDraftT={formDraftT}
            editingProfile={editingProfile}
            profile={profile}
            profileEditFrUx={profileEditFrUx}
            lang={lang}
            t={t}
          />
        ) : (
          <div className="space-y-1">
            <label
              htmlFor="targetSectors-needs"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-600"
            >
              {profileEditFrUx ? PROFILE_FIELD_LABELS.keywords : t('profileFormAboutKeywordsLabel')}{' '}
              <span className="text-[10px] font-normal normal-case text-slate-400">{t('targetSectorsOptional')}</span>
            </label>
            <input
              id="targetSectors-needs"
              name="targetSectors"
              defaultValue={
                formDraftT?.targetSectors ??
                (editingProfile?.targetSectors || profile?.targetSectors || []).join(', ')
              }
              placeholder={t('needKeywordsPlaceholder')}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all focus:ring-2 focus:ring-slate-400/40"
            />
            <ProfileFieldHint>
              {profileEditFrUx ? PROFILE_FIELD_HELP.keywords : t('needKeywordsHint')}
            </ProfileFieldHint>
          </div>
        )}
      </div>

      <p className="border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
        {t('profileFormMatchingFieldsFooter')}
      </p>
    </section>
  );
}
