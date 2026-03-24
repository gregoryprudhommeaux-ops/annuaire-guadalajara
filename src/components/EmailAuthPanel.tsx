import React, { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';
import type { Language } from '../types';
import { cn } from '../cn';
import { formatFirebaseAuthErrorMessage } from '../lib/firebaseAuthUi';
import { pickLang } from '../lib/uiLocale';

type Step = 'signin' | 'signup' | 'forgot';

type Props = {
  lang: Language;
  t: (key: string) => string;
  socialBusy: boolean;
  emailBusy: boolean;
  setEmailBusy: (v: boolean) => void;
  onError: (message: string) => void;
  clearError: () => void;
  /** Incrémenté à l’ouverture du modal pour réinitialiser le formulaire. */
  resetToken?: number;
};

const inputClass =
  'w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition-all focus:ring-2 focus:ring-stone-400';

export default function EmailAuthPanel({
  lang,
  t,
  socialBusy,
  emailBusy,
  setEmailBusy,
  onError,
  clearError,
  resetToken = 0,
}: Props) {
  const [step, setStep] = useState<Step>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    setStep('signin');
    setEmail('');
    setPassword('');
    setConfirm('');
    setInfoMessage(null);
  }, [resetToken]);

  const disabled = socialBusy || emailBusy;
  const host = typeof window !== 'undefined' ? window.location.host : '';

  const go = (next: Step) => {
    setStep(next);
    setInfoMessage(null);
    clearError();
    if (next === 'forgot') setPassword('');
    if (next === 'signin') setConfirm('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setInfoMessage(null);
    const em = email.trim();
    const pw = password;
    if (!em || !pw) {
      onError(t('authErrInvalidCredential'));
      return;
    }
    setEmailBusy(true);
    try {
      await signInWithEmailAndPassword(auth, em, pw);
    } catch (err) {
      onError(formatFirebaseAuthErrorMessage(err, t, host));
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setInfoMessage(null);
    const em = email.trim();
    if (!em) {
      onError(t('authErrInvalidEmail'));
      return;
    }
    if (password !== confirm) {
      onError(t('authPasswordMismatch'));
      return;
    }
    if (password.length < 6) {
      onError(t('authErrWeakPassword'));
      return;
    }
    setEmailBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, em, password);
      await sendEmailVerification(cred.user);
      setPassword('');
      setConfirm('');
      /* Utilisateur connecté : le modal se ferme via onAuthStateChanged ; bannière vérif. e-mail dans l’app. */
    } catch (err) {
      onError(formatFirebaseAuthErrorMessage(err, t, host));
    } finally {
      setEmailBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setInfoMessage(null);
    const em = email.trim();
    if (!em) {
      onError(t('authErrInvalidEmail'));
      return;
    }
    setEmailBusy(true);
    try {
      await sendPasswordResetEmail(auth, em);
      setInfoMessage(t('authResetEmailSent'));
    } catch (err) {
      onError(formatFirebaseAuthErrorMessage(err, t, host));
    } finally {
      setEmailBusy(false);
    }
  };

  const busySignIn = pickLang('Connexion…', 'Conectando…', 'Signing in…', lang);
  const busySignUp = pickLang('Création…', 'Creando…', 'Creating…', lang);
  const busySend = pickLang('Envoi…', 'Enviando…', 'Sending…', lang);

  return (
    <div className="mt-5 border-t border-stone-200 pt-5">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-stone-400">
        {t('authOrEmail')}
      </p>

      {infoMessage ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {infoMessage}
        </p>
      ) : null}

      {step === 'signin' && (
        <form onSubmit={handleSignIn} className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">{t('email')}</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">{t('authPassword')}</label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={disabled}
              className={inputClass}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={disabled}
            className={cn(
              'w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors',
              'hover:bg-stone-800 disabled:pointer-events-none disabled:opacity-60'
            )}
          >
            {emailBusy ? busySignIn : t('authEmailSignIn')}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              disabled={disabled}
              onClick={() => go('forgot')}
              className="font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline disabled:opacity-50"
            >
              {t('authEmailForgotLink')}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => go('signup')}
              className="font-medium text-blue-700 underline-offset-2 hover:text-blue-900 hover:underline disabled:opacity-50"
            >
              {t('authEmailSignUp')}
            </button>
          </div>
        </form>
      )}

      {step === 'signup' && (
        <form onSubmit={handleSignUp} className="mt-3 space-y-3">
          <p className="text-xs text-stone-500">{t('authEmailNoAccount')}</p>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">{t('email')}</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">{t('authPassword')}</label>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={disabled}
              className={inputClass}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">
              {t('authConfirmPassword')}
            </label>
            <input
              type="password"
              name="confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={disabled}
              className={inputClass}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={disabled}
            className={cn(
              'w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors',
              'hover:bg-stone-800 disabled:pointer-events-none disabled:opacity-60'
            )}
          >
            {emailBusy ? busySignUp : t('authEmailSignUp')}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => go('signin')}
            className="w-full text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline disabled:opacity-50"
          >
            {t('authEmailBackSignIn')}
          </button>
        </form>
      )}

      {step === 'forgot' && (
        <form onSubmit={handleForgot} className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">{t('email')}</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={disabled}
            className={cn(
              'w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors',
              'hover:bg-stone-800 disabled:pointer-events-none disabled:opacity-60'
            )}
          >
            {emailBusy ? busySend : t('authEmailSendReset')}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => go('signin')}
            className="w-full text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline disabled:opacity-50"
          >
            {t('authEmailBackSignIn')}
          </button>
        </form>
      )}
    </div>
  );
}
