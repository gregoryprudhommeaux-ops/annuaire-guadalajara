import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  t: (key: string) => string;
};

type FormStatus = 'idle' | 'sending' | 'success' | 'error' | 'not_configured';

export default function ContactFooterModal({ open, onClose, t }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName('');
      setEmail('');
      setMessage('');
      setHp('');
      setStatus('idle');
      setErrorDetail(null);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setErrorDetail(null);
    try {
      const apiBase = import.meta.env.VITE_CONTACT_API_URL?.replace(/\/$/, '') ?? '';
      const url = `${apiBase}/api/contact`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, website: hp }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        detail?: string;
      };
      if (res.status === 503 && data.code === 'not_configured') {
        setStatus('not_configured');
        return;
      }
      if (!res.ok || !data.ok) {
        setErrorDetail(typeof data.detail === 'string' && data.detail.trim() ? data.detail.trim() : null);
        setStatus('error');
        return;
      }
      setStatus('success');
    } catch {
      setErrorDetail(null);
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[220] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label={t('footerLegalClose')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative flex max-h-[min(92vh,640px)] w-full max-w-lg flex-col rounded-t-2xl border border-stone-200 bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6">
              <h2
                id="contact-modal-title"
                className="pr-8 text-lg font-bold leading-snug text-stone-900 sm:text-xl"
              >
                {t('contactFormTitle')}
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
              <p className="mb-4 text-sm leading-relaxed text-stone-600">{t('contactFormIntro')}</p>

              {status === 'success' ? (
                <p className="text-sm font-medium text-emerald-800">{t('contactFormSuccess')}</p>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="pointer-events-none absolute -left-[9999px] opacity-0" aria-hidden>
                    <label htmlFor="contact-hp">{t('contactFormHpLabel')}</label>
                    <input
                      id="contact-hp"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={hp}
                      onChange={(e) => setHp(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-name" className="mb-1 block text-xs font-semibold text-stone-600">
                      {t('contactFormName')}
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-900 outline-none ring-blue-600/0 transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-600/20"
                      placeholder={t('contactFormNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1 block text-xs font-semibold text-stone-600">
                      {t('contactFormEmail')}
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-900 outline-none ring-blue-600/0 transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-600/20"
                      placeholder={t('contactFormEmailPlaceholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="mb-1 block text-xs font-semibold text-stone-600">
                      {t('contactFormMessage')}
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full resize-y rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-900 outline-none ring-blue-600/0 transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-600/20"
                      placeholder={t('contactFormMessagePlaceholder')}
                    />
                  </div>
                  {status === 'error' ? (
                    <div className="space-y-1">
                      <p className="text-sm text-red-700">{t('contactFormErrorGeneric')}</p>
                      {errorDetail ? (
                        <p className="text-xs leading-snug text-stone-600 break-words">{errorDetail}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {status === 'not_configured' ? (
                    <p className="text-sm text-amber-800">{t('contactFormErrorConfig')}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-60"
                  >
                    {status === 'sending' ? t('contactFormSending') : t('contactFormSubmit')}
                  </button>
                </form>
              )}
            </div>

            <div className="shrink-0 border-t border-stone-100 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-stone-100 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-200 sm:w-auto sm:px-8"
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
