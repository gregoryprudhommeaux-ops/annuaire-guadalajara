import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import type { User } from 'firebase/auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { NATIONALITY_OPTIONS, nationalityLabel, sortNationalityOptions } from '@/lib/nationalityOptions';
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

type Question = {
  key: keyof Draft;
  label: string;
  placeholder?: string;
  hint?: string;
  optional?: boolean;
  area?: boolean;
  select?: boolean;
  type?: string;
  readOnly?: boolean;
};

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
  'w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-[15px] leading-snug text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:bg-white focus:shadow-[0_0_0_3px_var(--primary-soft)]';

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

  const nationalityOptions = useMemo(() => sortNationalityOptions(NATIONALITY_OPTIONS, lang), [lang]);

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
    const whatsapp = draft.whatsapp.trim();
    const city = draft.city.trim();
    const nationality = draft.nationality.trim().toUpperCase();
    if (!fullName || !email || !whatsapp || !nationality || !city) {
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
          whatsapp,
          mexicoSince: draft.mexicoSince.trim(),
          nationality,
          city,
          companyName: draft.companyName.trim(),
          lookingFor: draft.lookingFor.trim(),
          communityGap: draft.communityGap.trim(),
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
  const identityQuestions: Question[] = [
    { key: 'fullName', label: t('expressOnboardingFullName'), placeholder: 'Juan PÉREZ' },
    {
      key: 'email',
      label: t('expressOnboardingEmail'),
      placeholder: 'vous@exemple.com',
      hint: t('expressOnboardingEmailHint'),
      type: 'email',
      readOnly: emailLocked,
    },
    {
      key: 'whatsapp',
      label: t('expressOnboardingWhatsapp'),
      placeholder: '+52 …',
      hint: t('expressOnboardingWhatsappHint'),
    },
    { key: 'nationality', label: t('expressOnboardingNationality'), select: true },
    { key: 'city', label: t('expressOnboardingCity'), placeholder: t('expressOnboardingCityPlaceholder') },
  ];
  const extraQuestions: Question[] = [
    {
      key: 'mexicoSince',
      label: t('expressOnboardingMexicoSince'),
      placeholder: t('expressOnboardingMexicoSincePlaceholder'),
      optional: true,
    },
    {
      key: 'companyName',
      label: t('expressOnboardingCompany'),
      placeholder: t('expressOnboardingCompanyPlaceholder'),
      optional: true,
    },
    {
      key: 'lookingFor',
      label: t('expressOnboardingLookingFor'),
      area: true,
      optional: true,
      hint: t('expressOnboardingLookingForHint'),
    },
    {
      key: 'communityGap',
      label: t('expressOnboardingCommunityGap'),
      area: true,
      optional: true,
    },
  ];

  const successText =
    saved === 'created'
      ? t('expressOnboardingSuccess')
      : saved === 'updated'
        ? t('expressOnboardingSuccessUpdated')
        : saved === 'email_failed'
          ? t('expressOnboardingSuccessEmailFailed')
          : null;

  const renderQuestion = (q: Question, index: number) => (
    <li key={q.key} className="rounded-[16px] border border-[var(--border)]/80 bg-[var(--surface)]/70 p-4 sm:p-5">
      <label className="block">
        <span className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[11px] font-semibold tabular-nums text-[var(--primary)]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-[15px] font-semibold leading-snug text-[var(--text)]">{q.label}</span>
              {q.optional ? (
                <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                  {t('expressOnboardingOptional')}
                </span>
              ) : (
                <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                  {t('expressOnboardingRequired')}
                </span>
              )}
            </span>
            <span className="mt-3 block">
              {q.select ? (
                <select className={fieldClass} required={!q.optional} value={draft.nationality} onChange={set('nationality')}>
                  <option value="">{t('nationalitySelectPlaceholder')}</option>
                  {nationalityOptions.map((o) => (
                    <option key={o.code} value={o.code}>
                      {nationalityLabel(o.code, lang)}
                    </option>
                  ))}
                </select>
              ) : q.area ? (
                <textarea
                  className={`${fieldClass} min-h-[104px] resize-y`}
                  required={!q.optional}
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
                    q.key === 'fullName'
                      ? 'name'
                      : q.key === 'email'
                        ? 'email'
                        : q.key === 'whatsapp'
                          ? 'tel'
                          : q.key === 'city'
                            ? 'address-level2'
                            : 'off'
                  }
                  inputMode={q.key === 'whatsapp' ? 'tel' : q.key === 'email' ? 'email' : undefined}
                />
              )}
              {q.hint ? <span className="mt-2 block text-xs leading-relaxed text-[var(--text-muted)]">{q.hint}</span> : null}
            </span>
          </span>
        </span>
      </label>
    </li>
  );

  return (
    <div className="flex-1 bg-[var(--bg)] text-[var(--text)]">
      <Helmet>
        <title>{`${t('expressOnboardingTitle')} · FrancoNetwork`}</title>
      </Helmet>
      <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-8 sm:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">{t('expressOnboardingEyebrow')}</p>
        <h1 className="mt-2 text-[1.7rem] font-semibold leading-tight tracking-tight sm:text-3xl">{t('expressOnboardingTitle')}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--text-muted)]">{t('expressOnboardingLead')}</p>
        <p className="mt-4 inline-flex max-w-full rounded-full border border-[var(--primary)]/20 bg-[var(--primary-soft)] px-3 py-1.5 text-xs font-medium text-[var(--primary)]">
          {t('expressOnboardingRequiredHint')}
        </p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 sm:mt-10">
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

          <section>
            <h2 className="text-sm font-semibold text-[var(--text)]">{t('expressOnboardingSectionIdentity')}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{t('expressOnboardingSectionIdentityLead')}</p>
            <ol className="mt-4 space-y-3 sm:space-y-4">{identityQuestions.map((q, i) => renderQuestion(q, i))}</ol>
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-semibold text-[var(--text)]">{t('expressOnboardingSectionExtra')}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{t('expressOnboardingSectionExtraLead')}</p>
            <ol className="mt-4 space-y-3 sm:space-y-4">
              {extraQuestions.map((q, i) => renderQuestion(q, identityQuestions.length + i))}
            </ol>
          </section>

          {error ? (
            <p className="mt-8 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          {successText ? (
            <p className="mt-8 text-sm text-[var(--success)]" role="status">
              {successText}
            </p>
          ) : null}

          <div className="sticky bottom-0 z-10 -mx-4 mt-10 border-t border-[var(--border)] bg-[var(--bg)]/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <Button type="submit" disabled={busy} fullWidth className="sm:w-auto">
              {busy ? t('expressOnboardingSubmitting') : t('expressOnboardingSubmit')}
            </Button>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
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
