import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { User } from 'firebase/auth';
import { Plus, MapPin, User as UserIcon } from 'lucide-react';
import type { Language, UrgentPost, UserProfile } from '../../types';
import AiTranslatedFreeText from '../AiTranslatedFreeText';
import { ProfileCardEmailContact, ProfileCardWhatsappContactFooter } from '../profile/ProfileCardUi';
import { uiLocale } from '../../lib/uiLocale';

type TFn = (key: string) => string;

type Props = {
  open: boolean;
  post: UrgentPost | null;
  authorProfile: UserProfile | null;
  viewerUser: User | null;
  viewerProfile: UserProfile | null;
  lang: Language;
  t: TFn;
  activityCategoryLabel: (cat: string, lang: Language) => string;
  /** Libellé si le secteur de l’annonce est vide (ex. « Besoin urgent »). */
  urgentNeedLabel: string;
  onClose: () => void;
  onOpenAuth: () => void;
  onViewFullProfile: () => void;
  /** Opportunité en attente de modération : actions admin dans le pied de modale. */
  showModerationActions?: boolean;
  onModerationPublish?: () => void | Promise<void>;
  onModerationReject?: () => void | Promise<void>;
  moderationActionError?: string | null;
};

export default function OpportunityDetailModal({
  open,
  post,
  authorProfile,
  viewerUser,
  viewerProfile,
  lang,
  t,
  activityCategoryLabel,
  urgentNeedLabel,
  onClose,
  onOpenAuth,
  onViewFullProfile,
  showModerationActions = false,
  onModerationPublish,
  onModerationReject,
  moderationActionError = null,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!post) return null;

  const sectorLabel = post.sector?.trim()
    ? activityCategoryLabel(post.sector, lang) || post.sector
    : urgentNeedLabel;

  const authorName =
    authorProfile?.fullName?.trim() ||
    post.authorName?.trim() ||
    '';
  const authorCompany =
    authorProfile?.companyName?.trim() || post.authorCompany?.trim() || '';
  const city = (authorProfile?.city || '').trim();

  const canViewContacts = Boolean(viewerUser && authorProfile);
  const emailCanView = Boolean(
    authorProfile &&
      (authorProfile.isEmailPublic || (viewerUser && viewerProfile?.isValidated))
  );
  const waCanView = Boolean(
    authorProfile &&
      (authorProfile.isWhatsappPublic || (viewerUser && viewerProfile?.isValidated))
  );

  const postedLabel =
    post.createdAt > 0
      ? new Date(post.createdAt).toLocaleDateString(uiLocale(lang), {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[175] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label={t('footerLegalClose')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/65 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="opportunity-detail-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative flex max-h-[min(90vh,760px)] w-full max-w-lg flex-col rounded-t-2xl border border-stone-200 bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6">
              <h2
                id="opportunity-detail-title"
                className="pr-10 text-lg font-bold leading-snug text-stone-900 sm:text-xl"
              >
                {t('opportunityDetailTitle')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:right-4 sm:top-4"
                aria-label={t('footerLegalClose')}
              >
                <Plus size={22} className="rotate-45" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {t('opportunityDetailMessageHeading')}
                  </p>
                  <div className="mt-2 text-base leading-relaxed text-stone-800">
                    <AiTranslatedFreeText
                      lang={lang}
                      t={t}
                      text={post.text}
                      as="p"
                      omitAiDisclaimer
                      className="whitespace-pre-wrap text-pretty leading-relaxed"
                    />
                  </div>
                  {postedLabel ? (
                    <p className="mt-3 text-xs text-stone-400">{postedLabel}</p>
                  ) : null}
                </div>

                <div>
                  <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600 ring-1 ring-stone-200/80">
                    {sectorLabel}
                  </span>
                </div>

                <div className="rounded-xl border border-stone-100 bg-stone-50/80 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {t('opportunityDetailAuthorHeading')}
                  </p>
                  {!viewerUser ? (
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">
                      {t('opportunityDetailSignInPrompt')}
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {authorName ? (
                        <div className="flex items-start gap-2">
                          <UserIcon
                            className="mt-0.5 h-4 w-4 shrink-0 text-stone-400"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <p className="text-sm font-semibold text-stone-900">{authorName}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-stone-500">—</p>
                      )}
                      {authorCompany ? (
                        <p className="text-sm text-stone-600">{authorCompany}</p>
                      ) : null}
                      {city ? (
                        <p className="flex items-center gap-1.5 text-xs text-stone-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {city}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>

                {viewerUser && authorProfile ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {t('opportunityDetailContactHeading')}
                    </p>
                    <p className="text-xs leading-snug text-stone-500">
                      {t('opportunityDetailContactHint')}
                    </p>
                    <div className="space-y-2 rounded-xl border border-stone-100 bg-white p-3">
                      <ProfileCardEmailContact
                        email={authorProfile.email}
                        canView={emailCanView}
                        t={t}
                      />
                      {authorProfile.whatsapp ? (
                        <ProfileCardWhatsappContactFooter
                          whatsapp={authorProfile.whatsapp}
                          canView={waCanView}
                          t={t}
                        />
                      ) : (
                        <p className="px-1 py-2 text-xs text-stone-400">{t('affinityWhatsAppMissing')}</p>
                      )}
                    </div>
                  </div>
                ) : null}

                {viewerUser && !authorProfile && post.authorId ? (
                  <p className="text-xs leading-relaxed text-amber-800">
                    {t('opportunityDetailAuthorUnavailable')}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 space-y-2 border-t border-stone-100 px-4 py-3 sm:px-6">
              {moderationActionError ? (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-snug text-red-800"
                  role="alert"
                >
                  {moderationActionError}
                </p>
              ) : null}
              {showModerationActions ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <button
                    type="button"
                    onClick={() => void onModerationPublish?.()}
                    className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 sm:flex-1"
                  >
                    {t('opportunityPublish')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onModerationReject?.()}
                    className="w-full rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50 sm:flex-1"
                  >
                    {t('delete')}
                  </button>
                </div>
              ) : null}
              {!viewerUser ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth();
                    onClose();
                  }}
                  className="w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  {t('guestJoinCta')}
                </button>
              ) : null}
              {viewerUser && authorProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    onViewFullProfile();
                    onClose();
                  }}
                  className="w-full rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
                >
                  {t('opportunityViewFullProfile')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-stone-100 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-200"
              >
                {t('footerLegalClose')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
