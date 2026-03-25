import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import type { User } from 'firebase/auth';
import type { Language, MemberNetworkRequest, UserProfile } from '../../types';
import { cn } from '../../cn';
import { cardPad } from '../../lib/pageLayout';
import { ACTIVITY_CATEGORIES, activityCategoryLabel } from '../../constants';
import AiTranslatedFreeText from '../AiTranslatedFreeText';
import ProfileAvatar from '../ProfileAvatar';
import { MEMBER_REQUEST_DEFAULT_DURATION_MS } from '../../lib/memberRequests';

type TFn = (key: string) => string;

export type MemberRequestFormValues = {
  text: string;
  sector: string;
  zone: string;
  productOrService: string;
};

type Props = {
  t: TFn;
  lang: Language;
  requests: MemberNetworkRequest[];
  user: User | null;
  profile: UserProfile | null;
  viewerIsAdmin: boolean;
  onOpenAuth: () => void;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

const emptyForm: MemberRequestFormValues = {
  text: '',
  sector: '',
  zone: '',
  productOrService: '',
};

export default function MemberRequestsSection({
  t,
  lang,
  requests,
  user,
  profile,
  viewerIsAdmin,
  onOpenAuth,
  onCreate,
  onDelete,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<MemberRequestFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const canPost = Boolean(user && profile?.uid);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setForm(emptyForm);
    setFormError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.uid) {
      setFormError(t('memberRequestNeedProfile'));
      return;
    }
    const text = form.text.trim();
    if (text.length < 1) {
      setFormError(t('memberRequestTextRequired'));
      return;
    }
    if (text.length > 800) {
      setFormError(t('memberRequestTextTooLong'));
      return;
    }
    const zone = form.zone.trim();
    if (zone.length < 1) {
      setFormError(t('memberRequestZoneRequired'));
      return;
    }
    const productOrService = form.productOrService.trim();
    if (productOrService.length < 1) {
      setFormError(t('memberRequestProductRequired'));
      return;
    }
    const now = Date.now();
    const payload: Record<string, unknown> = {
      authorId: user.uid,
      authorName: profile.fullName?.trim() || 'Membre',
      authorPhoto: profile.photoURL || user.photoURL || '',
      authorCompany: (profile.companyName || '').trim().slice(0, 200),
      text: text.slice(0, 800),
      zone: zone.slice(0, 200),
      productOrService: productOrService.slice(0, 200),
      createdAt: now,
      expiresAt: now + MEMBER_REQUEST_DEFAULT_DURATION_MS,
    };
    const sector = form.sector.trim();
    if (sector) payload.sector = sector.slice(0, 200);

    setSaving(true);
    setFormError(null);
    try {
      await onCreate(payload);
      closeModal();
    } catch (err) {
      if (err instanceof FirebaseError) {
        if (err.code === 'permission-denied') {
          setFormError(t('memberRequestErrorPermissionDenied'));
          return;
        }
        if (
          err.code === 'unavailable' ||
          err.code === 'deadline-exceeded' ||
          err.code === 'resource-exhausted'
        ) {
          setFormError(t('urgentPostErrorNetwork'));
          return;
        }
      }
      setFormError(t('memberRequestSubmitError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('memberRequestDeleteConfirm'))) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <section
        className={cn(
          'min-w-0 rounded-2xl border border-stone-200 bg-white shadow-sm',
          cardPad,
          'space-y-4'
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h2 className="flex items-center gap-2 text-lg font-bold leading-snug tracking-tight text-stone-900">
              <Megaphone className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <span className="break-words">{t('memberRequestsTitle')}</span>
            </h2>
            <p className="text-sm leading-relaxed text-stone-600">{t('memberRequestsSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!canPost) {
                onOpenAuth();
                return;
              }
              setModalOpen(true);
            }}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors',
              'bg-amber-600 text-white hover:bg-amber-700',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600'
            )}
          >
            <Plus size={18} aria-hidden />
            {t('memberRequestsPostCta')}
          </button>
        </div>

        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-6 text-center text-sm text-stone-600">
            {t('memberRequestsEmpty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => {
              const canDelete =
                (user && r.authorId === user.uid) || viewerIsAdmin;
              return (
                <li
                  key={r.id}
                  className="rounded-xl border border-stone-100 bg-stone-50/40 p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <ProfileAvatar
                      photoURL={r.authorPhoto}
                      fullName={r.authorName}
                      className="h-10 w-10 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-900">{r.authorName}</p>
                          {r.authorCompany ? (
                            <p className="text-xs text-stone-500">{r.authorCompany}</p>
                          ) : null}
                        </div>
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="shrink-0 rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            aria-label={t('memberRequestDeleteAria')}
                          >
                            <Trash2 size={18} aria-hidden />
                          </button>
                        ) : null}
                      </div>
                      {(r.sector || r.zone || r.productOrService) && (
                        <div className="flex flex-wrap gap-1.5">
                          {r.sector ? (
                            <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
                              {activityCategoryLabel(r.sector, lang)}
                            </span>
                          ) : null}
                          {r.zone ? (
                            <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
                              {r.zone}
                            </span>
                          ) : null}
                          {r.productOrService ? (
                            <span className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
                              {r.productOrService}
                            </span>
                          ) : null}
                        </div>
                      )}
                      <div className="text-sm leading-relaxed text-stone-800">
                        <AiTranslatedFreeText t={t} text={r.text} lang={lang} as="p" />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-stone-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-request-modal-title"
          >
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 p-5 sm:p-6">
              <h3
                id="member-request-modal-title"
                className="text-lg font-bold tracking-tight text-stone-900 sm:text-xl"
              >
                {t('memberRequestsModalTitle')}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="shrink-0 rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-200"
                aria-label={t('close')}
              >
                <Plus className="h-6 w-6 rotate-45" aria-hidden />
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5 sm:p-6">
              <p className="text-xs text-stone-500">{t('memberRequestsExpiresHint')}</p>

              <div>
                <label
                  htmlFor="member-request-text"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400"
                >
                  {t('memberRequestsTextLabel')}
                </label>
                <textarea
                  id="member-request-text"
                  value={form.text}
                  onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                  rows={5}
                  maxLength={800}
                  required
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-inner focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder={t('memberRequestsTextPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="member-request-sector"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400"
                >
                  {t('memberRequestsSectorLabel')}
                </label>
                <select
                  id="member-request-sector"
                  value={form.sector}
                  onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">{t('memberRequestsSectorOptional')}</option>
                  {ACTIVITY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {activityCategoryLabel(c, lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="member-request-zone"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400"
                >
                  {t('memberRequestsZoneLabel')}
                </label>
                <input
                  id="member-request-zone"
                  type="text"
                  value={form.zone}
                  onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
                  maxLength={200}
                  required
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder={t('memberRequestsZonePlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="member-request-product"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-400"
                >
                  {t('memberRequestsProductLabel')}
                </label>
                <input
                  id="member-request-product"
                  type="text"
                  value={form.productOrService}
                  onChange={(e) => setForm((f) => ({ ...f, productOrService: e.target.value }))}
                  maxLength={200}
                  required
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder={t('memberRequestsProductPlaceholder')}
                />
              </div>

              {formError ? (
                <p className="text-sm text-red-600" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving ? t('urgentPostSaving') : t('memberRequestsSubmit')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
