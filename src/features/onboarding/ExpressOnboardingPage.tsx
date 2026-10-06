import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import type { User } from 'firebase/auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { NATIONALITY_OPTIONS, nationalityLabel } from '@/lib/nationalityOptions';
import { Button } from '@/components/ui/Button';
import type { UserProfile } from '@/types';

const DRAFT_KEY = 'fn_express_onboarding_v1';

type Draft = {
  fullName: string;
  email: string;
  whatsapp: string;
  mexicoSince: string;
  nationality: string;
  city: string;
  companyName: string;
  lookingFor: string;
  communityGap: string;
};

type SaveState = 'created' | 'updated' | 'email_failed' | null;

const EMPTY: Draft = {
  fullName: '',
  email: '',
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

function expressOnboardingUrl(): string {
  const projectId =
    (import.meta as { env?: { VITE_FIREBASE_PROJECT_ID?: string } }).env?.VITE_FIREBASE_PROJECT_ID ||
    'gen-lang-client-0229891518';
  return `https://us-central1-${projectId}.cloudfunctions.net/expressOnboarding`;
}

const fieldClass =
  'w-full border-0 border-b border-[var(--border)] bg-transparent px-0 py-2.5 text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]';

export type ExpressOnboardingPageProps = {
  user: User | null;
  profile: UserProfile | null;
  onNeedAuth: () => void;
};

export default function ExpressOnboardingPage({ user, profile, onNeedAuth }: ExpressOnboardingPageProps) {
  const { lang, t } = useLanguage();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [honeypot, setHoneypot] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SaveState>(null);

  useEffect(() => {
    const stored = readDraft();
    const fromProfile: Draft = {
      fullName: profile?.fullName || stored.fullName,
      email: user?.email || profile?.email || stored.email,
      whatsapp: profile?.whatsapp || stored.whatsapp,
      mexicoSince: profile?.mexicoArrivalNote || stored.mexicoSince,
      nationality: stored.nationality,
      city: profile?.city || stored.city,
      companyName: profile?.companyName || stored.companyName,
      lookingFor: profile?.lookingFor || profile?.networkGoal || stored.lookingFor,
      communityGap: profile?.helpNewcomers || stored.communityGap,
    };
    setDraft(fromProfile);
    setHydrated(true);
  }, [profile?.uid, user?.email]);

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

  const set =
    (key: keyof Draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setSaved(null);
      setError(null);
      setDraft((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(null);
    const fullName = draft.fullName.trim();
    const email = (user?.email || draft.email).trim();
    const city = draft.city.trim();
    const mexicoSince = draft.mexicoSince.trim();
    const lookingFor = draft.lookingFor.trim();
    const communityGap = draft.communityGap.trim();
    const nationality = draft.nationality.trim().toUpperCase();
    if (!fullName || !email || !mexicoSince || !nationality || !city || !lookingFor || !communityGap) {
      setError(t('expressOnboardingMissing'));
      return;
    }
    if (!NATIONALITY_OPTIONS.some((o) => o.code === nationality)) {
      setError(t('expressOnboardingMissing'));
      return;
    }

    setBusy(true);
    try {
      const idToken = user ? await user.getIdToken() : null;
      const response = await fetch(expressOnboardingUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          fullName,
          email,
          whatsapp: draft.whatsapp.trim(),
          mexicoSince,
          nationality,
          city,
          companyName: draft.companyName.trim(),
          lookingFor,
          communityGap,
          lang,
          companyWebsite: honeypot,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        created?: boolean;
        emailSent?: boolean;
      };
      if (response.status === 409 || data.code === 'already_exists') {
        setError(t('expressOnboardingAlreadyExists'));
        return;
      }
      if (!response.ok || !data.ok) {
        setError(t('expressOnboardingError'));
        return;
      }
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setSaved(data.created ? (data.emailSent ? 'created' : 'email_failed') : 'updated');
    } catch (err) {
      console.error('[express-onboarding]', err);
      setError(t('expressOnboardingError'));
    } finally {
      setBusy(false);
    }
  };

  const emailLocked = Boolean(user?.email);
  const questions: Array<{
    key: keyof Draft;
    label: string;
    placeholder?: string;
    hint?: string;
    optional?: boolean;
    area?: boolean;
    select?: boolean;
    type?: string;
    readOnly?: boolean;
  }> = [
    { key: 'fullName', label: t('expressOnboardingFullName'), placeholder: 'Juan PÉREZ' },
    {
      key: 'email',
      label: t('expressOnboardingEmail'),
      placeholder: 'vous@exemple.com',
      hint: t('expressOnboardingEmailHint'),
      type: 'email',
      readOnly: emailLocked,
    },
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

  const successText =
    saved === 'created'
      ? t('expressOnboardingSuccess')
      : saved === 'updated'
        ? t('expressOnboardingSuccessUpdated')
        : saved === 'email_failed'
          ? t('expressOnboardingSuccessEmailFailed')
          : null;

  return (
    <div className="flex-1 bg-[var(--bg)] text-[var(--text)]">
      <Helmet>
        <title>{`${t('expressOnboardingTitle')} · FrancoNetwork`}</title>
      </Helmet>
      <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-3xl">{t('expressOnboardingTitle')}</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--text-muted)]">{t('expressOnboardingLead')}</p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-10">
          <input
            type="text"
            name="companyWebsite"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            aria-hidden
          />
          <ol className="space-y-8">
            {questions.map((q, i) => (
              <li key={q.key}>
                <label className="block">
                  <span className="flex items-baseline gap-3">
                    <span className="w-7 shrink-0 text-xs tabular-nums text-[var(--text-muted)]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-medium leading-snug">
                      {q.label}
                      {q.optional ? (
                        <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">{t('expressOnboardingOptional')}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="mt-2 block pl-10">
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
                        className={`${fieldClass} min-h-[96px] resize-y`}
                        required
                        value={draft[q.key]}
                        onChange={set(q.key)}
                      />
                    ) : (
                      <input
                        className={fieldClass}
                        required={!q.optional}
                        readOnly={q.readOnly}
                        type={q.type || 'text'}
                        value={draft[q.key]}
                        onChange={set(q.key)}
                        placeholder={q.placeholder}
                        autoComplete={
                          q.key === 'fullName' ? 'name' : q.key === 'email' ? 'email' : q.key === 'whatsapp' ? 'tel' : q.key === 'city' ? 'address-level2' : 'off'
                        }
                        inputMode={q.key === 'whatsapp' ? 'tel' : q.key === 'email' ? 'email' : undefined}
                      />
                    )}
                    {q.hint ? <span className="mt-1.5 block text-xs leading-relaxed text-[var(--text-muted)]">{q.hint}</span> : null}
                  </span>
                </label>
              </li>
            ))}
          </ol>

          {error ? (
            <p className="mt-8 pl-10 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          {successText ? (
            <p className="mt-8 pl-10 text-sm text-[var(--success)]" role="status">
              {successText}
            </p>
          ) : null}

          <div className="mt-10 pl-10">
            <Button type="submit" disabled={busy}>
              {busy ? t('expressOnboardingSubmitting') : t('expressOnboardingSubmit')}
            </Button>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              {user ? (
                <Link to="/profile/edit" className="text-[var(--primary)] underline-offset-2 hover:underline">
                  {t('expressOnboardingLaterLink')}
                </Link>
              ) : (
                <button type="button" onClick={onNeedAuth} className="text-left text-[var(--primary)] underline-offset-2 hover:underline">
                  {t('expressOnboardingSignInToEdit')}
                </button>
              )}
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
