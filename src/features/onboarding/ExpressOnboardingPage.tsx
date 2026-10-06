import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import type { User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useLanguage } from '@/i18n/LanguageProvider';
import { NATIONALITY_OPTIONS, nationalityLabel } from '@/lib/nationalityOptions';
import { newCompanyActivitySlotId } from '@/lib/companyActivities';
import { USER_ADMIN_PRIVATE_COLLECTION } from '@/lib/userAdminPrivate';
import type { CompanyActivitySlot, UserProfile } from '@/types';

const DRAFT_KEY = 'fn_express_onboarding_v1';

type Draft = {
  fullName: string;
  whatsapp: string;
  mexicoSince: string;
  nationality: string;
  city: string;
  companyName: string;
  lookingFor: string;
  communityGap: string;
};

const EMPTY: Draft = {
  fullName: '',
  whatsapp: '',
  mexicoSince: '',
  nationality: '',
  city: '',
  companyName: '',
  lookingFor: '',
  communityGap: '',
};

function readDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function yearsToArrivalYear(raw: string): number | undefined {
  const t = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return undefined;
  const years = Math.floor(Number(t));
  if (!Number.isFinite(years) || years < 0 || years > 120) return undefined;
  return new Date().getFullYear() - years;
}

const fieldClass =
  'w-full border-0 border-b border-stone-200 bg-transparent px-0 py-2 text-[15px] text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-900';

export type ExpressOnboardingPageProps = {
  user: User | null;
  profile: UserProfile | null;
  onNeedAuth: () => void;
};

export default function ExpressOnboardingPage({ user, profile, onNeedAuth }: ExpressOnboardingPageProps) {
  const { lang, setLang, t } = useLanguage();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = readDraft();
    const fromProfile: Draft = profile
      ? {
          fullName: profile.fullName || stored.fullName,
          whatsapp: profile.whatsapp || stored.whatsapp,
          mexicoSince: profile.mexicoArrivalNote || stored.mexicoSince,
          nationality: stored.nationality,
          city: profile.city || stored.city,
          companyName: profile.companyName || stored.companyName,
          lookingFor: profile.lookingFor || profile.networkGoal || stored.lookingFor,
          communityGap: profile.helpNewcomers || stored.communityGap,
        }
      : stored;
    setDraft(fromProfile);
    setHydrated(true);
  }, [profile?.uid]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft, hydrated]);

  const nationalityOptions = useMemo(
    () =>
      [...NATIONALITY_OPTIONS].sort((a, b) =>
        nationalityLabel(a.code, lang).localeCompare(nationalityLabel(b.code, lang), lang)
      ),
    [lang]
  );

  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSaved(false);
    setDraft((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) {
      onNeedAuth();
      return;
    }
    const fullName = draft.fullName.trim();
    const companyName = draft.companyName.trim() || 'N/A';
    const city = draft.city.trim();
    const mexicoSince = draft.mexicoSince.trim();
    const lookingFor = draft.lookingFor.trim();
    const communityGap = draft.communityGap.trim();
    const nationality = draft.nationality.trim().toUpperCase();
    if (!fullName || !mexicoSince || !nationality || !city || !lookingFor || !communityGap) {
      setError(t('expressOnboardingMissing'));
      return;
    }
    if (!NATIONALITY_OPTIONS.some((o) => o.code === nationality)) {
      setError(t('expressOnboardingMissing'));
      return;
    }

    setBusy(true);
    try {
      const arrivalYear = yearsToArrivalYear(mexicoSince);
      const email = (user.email || profile?.email || '').trim();
      const existingSlots = profile?.companyActivities ?? [];
      const companyActivities: CompanyActivitySlot[] =
        existingSlots.length > 0
          ? existingSlots.map((slot, i) =>
              i === 0 ? { ...slot, companyName, city } : slot
            )
          : [
              {
                id: newCompanyActivitySlotId(),
                companyName,
                city,
                website: '',
                state: '',
                neighborhood: '',
                country: '',
                positionCategory: '',
                employeeCount: '',
              },
            ];

      const payload: Record<string, unknown> = {
        uid: user.uid,
        fullName,
        companyName,
        email,
        city,
        whatsapp: draft.whatsapp.trim(),
        lookingFor,
        networkGoal: lookingFor,
        helpNewcomers: communityGap,
        mexicoArrivalNote: mexicoSince,
        companyActivities,
        lastSeen: Date.now(),
      };
      if (arrivalYear !== undefined) payload.arrivalYear = arrivalYear;
      if (!profile) {
        payload.role = 'user';
        payload.createdAt = serverTimestamp();
        payload.isValidated = false;
        payload.needsAdminReview = true;
      }

      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
      await setDoc(
        doc(db, USER_ADMIN_PRIVATE_COLLECTION, user.uid),
        { uid: user.uid, nationality, updatedAt: serverTimestamp() },
        { merge: true }
      );
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setSaved(true);
    } catch (err) {
      console.error('[express-onboarding]', err);
      setError(t('expressOnboardingError'));
    } finally {
      setBusy(false);
    }
  };

  const questions: Array<{
    key: keyof Draft;
    label: string;
    placeholder?: string;
    optional?: boolean;
    area?: boolean;
    select?: boolean;
  }> = [
    { key: 'fullName', label: t('expressOnboardingFullName'), placeholder: 'Juan PÉREZ' },
    { key: 'whatsapp', label: t('expressOnboardingWhatsapp'), placeholder: '+52 …', optional: true },
    {
      key: 'mexicoSince',
      label: t('expressOnboardingMexicoSince'),
      placeholder: t('expressOnboardingMexicoSincePlaceholder'),
    },
    { key: 'nationality', label: t('expressOnboardingNationality'), select: true },
    { key: 'city', label: t('expressOnboardingCity'), placeholder: t('expressOnboardingCityPlaceholder') },
    {
      key: 'companyName',
      label: t('expressOnboardingCompany'),
      placeholder: t('expressOnboardingCompanyPlaceholder'),
    },
    { key: 'lookingFor', label: t('expressOnboardingLookingFor'), area: true },
    { key: 'communityGap', label: t('expressOnboardingCommunityGap'), area: true },
  ];

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-stone-900">
      <Helmet>
        <title>{`${t('expressOnboardingTitle')} · FrancoNetwork`}</title>
      </Helmet>
      <header className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-5">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          FrancoNetwork
        </Link>
        <div className="flex rounded-full bg-white p-0.5 text-[11px] font-semibold tracking-wide shadow-sm" role="group" aria-label={t('expressOnboardingLangLabel')}>
          {(['fr', 'en', 'es'] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={
                lang === code
                  ? 'rounded-full bg-stone-900 px-2.5 py-1 text-white'
                  : 'rounded-full px-2.5 py-1 text-stone-500 hover:text-stone-800'
              }
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-5 pb-16">
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight">{t('expressOnboardingTitle')}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500">{t('expressOnboardingLead')}</p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-10">
          <ol className="space-y-8">
            {questions.map((q, i) => (
              <li key={q.key}>
                <label className="block">
                  <span className="flex items-baseline gap-3">
                    <span className="w-6 shrink-0 text-xs tabular-nums text-stone-400">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-medium leading-snug">
                      {q.label}
                      {q.optional ? (
                        <span className="ml-2 text-xs font-normal text-stone-400">{t('expressOnboardingOptional')}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="mt-2 block pl-9">
                    {q.select ? (
                      <select className={fieldClass} required value={draft.nationality} onChange={set('nationality')}>
                        <option value="">{t('nationalitySelectPlaceholder')}</option>
                        {nationalityOptions.map((o) => (
                          <option key={o.code} value={o.code}>
                            {nationalityLabel(o.code, lang)}
                          </option>
                        ))}
                      </select>
                    ) : q.area ? (
                      <textarea
                        className={`${fieldClass} min-h-[88px] resize-y`}
                        required
                        value={draft[q.key]}
                        onChange={set(q.key)}
                      />
                    ) : (
                      <input
                        className={fieldClass}
                        required={!q.optional}
                        value={draft[q.key]}
                        onChange={set(q.key)}
                        placeholder={q.placeholder}
                        autoComplete={q.key === 'fullName' ? 'name' : q.key === 'whatsapp' ? 'tel' : q.key === 'city' ? 'address-level2' : 'off'}
                        inputMode={q.key === 'whatsapp' ? 'tel' : undefined}
                      />
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ol>

          {error ? (
            <p className="mt-8 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="mt-8 text-sm text-emerald-800" role="status">
              {t('expressOnboardingSuccess')}
            </p>
          ) : null}

          <div className="mt-10 pl-9">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
            >
              {busy ? t('expressOnboardingSubmitting') : user ? t('expressOnboardingSubmit') : t('expressOnboardingNeedAuth')}
            </button>
            <p className="mt-4 text-xs text-stone-500">
              {user ? (
                <Link to="/profile/edit" className="underline-offset-2 hover:underline">
                  {t('expressOnboardingLaterLink')}
                </Link>
              ) : (
                <Link to="/inscription" className="underline-offset-2 hover:underline">
                  {t('expressOnboardingSignupLink')}
                </Link>
              )}
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
