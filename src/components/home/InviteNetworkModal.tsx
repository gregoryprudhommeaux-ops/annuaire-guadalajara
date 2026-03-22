import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Copy, Mail, Phone, Plus, Share2 } from 'lucide-react';
import type { Language } from '../../types';
import { pickLang } from '../../lib/uiLocale';

type TFn = (key: string) => string;

type Props = {
  open: boolean;
  onClose: () => void;
  lang: Language;
  t: TFn;
};

/** Modale : partager le lien de l’annuaire (WhatsApp, e-mail, copie). */
export default function InviteNetworkModal({ open, onClose, lang, t }: Props) {
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}`;
  }, [open]);

  const message = useMemo(
    () => t('inviteShareBody').replace(/\{url\}/g, shareUrl),
    [shareUrl, t]
  );
  const subject = t('inviteEmailSubject');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(message);
    alert(pickLang('Copié !', '¡Copiado!', 'Copied!', lang));
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-network-title"
      >
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 p-5 sm:p-6">
          <h3
            id="invite-network-title"
            className="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight text-stone-900 sm:text-xl"
          >
            <Share2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
            <span className="min-w-0 break-words">{t('inviteNetworkModalTitle')}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-200"
            aria-label={t('close')}
          >
            <Plus className="h-6 w-6 rotate-45" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-stone-600 break-words hyphens-auto">
            {t('inviteNetworkModalHint')}
          </p>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-400">
              {t('inviteNetworkMessageLabel')}
            </label>
            <textarea
              readOnly
              value={message}
              rows={6}
              className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-800 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-600"
            >
              <Phone className="h-5 w-5 shrink-0" aria-hidden />
              {t('inviteShareWhatsApp')}
            </button>
            <button
              type="button"
              onClick={handleEmail}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white py-3 font-bold text-stone-800 transition-colors hover:bg-stone-50"
            >
              <Mail className="h-5 w-5 shrink-0" aria-hidden />
              {t('inviteShareEmail')}
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-stone-100 py-3 font-bold text-stone-700 transition-colors hover:bg-stone-200"
          >
            <Copy className="h-5 w-5 shrink-0" aria-hidden />
            {t('inviteShareCopy')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
