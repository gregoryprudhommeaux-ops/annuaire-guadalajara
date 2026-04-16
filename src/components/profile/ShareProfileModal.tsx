import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Copy, Mail, MessageCircle, Share2 } from 'lucide-react';
import type { Language, UserProfile } from '@/types';
import { pickLang } from '@/lib/uiLocale';
import { getPublicSiteOrigin } from '@/lib/siteUrls';

type TFn = (key: string) => string;

type Props = {
  open: boolean;
  onClose: () => void;
  lang: Language;
  t: TFn;
  profile: UserProfile;
};

export default function ShareProfileModal({ open, onClose, lang, t, profile }: Props) {
  const profileUrl = useMemo(() => {
    const origin = getPublicSiteOrigin() || (typeof window !== 'undefined' ? window.location.origin : '');
    const base = origin || '';
    return `${base}/profil/${encodeURIComponent(profile.uid)}`;
  }, [profile.uid]);

  const message = useMemo(() => {
    const name = (profile.fullName || profile.companyName || profile.uid || '').toString().trim() || '—';
    return pickLang(
      `Profil : ${name}\n${profileUrl}`,
      `Perfil: ${name}\n${profileUrl}`,
      `Profile: ${name}\n${profileUrl}`,
      lang
    );
  }, [lang, profile.companyName, profile.fullName, profile.uid, profileUrl]);

  const emailSubject = useMemo(() => {
    const name = (profile.fullName || profile.companyName || profile.uid || '').toString().trim() || '—';
    return `${name} · ${t('title')}`;
  }, [profile.companyName, profile.fullName, profile.uid, t]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      alert(pickLang('Copié !', '¡Copiado!', 'Copied!', lang));
    } catch {
      alert(pickLang('Impossible de copier.', 'No se pudo copiar.', 'Copy failed.', lang));
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-profile-title"
      >
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 p-5 sm:p-6">
          <h3
            id="share-profile-title"
            className="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight text-stone-900 sm:text-xl"
          >
            <Share2 className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
            <span className="min-w-0 break-words">
              {pickLang('Partager le profil', 'Compartir perfil', 'Share profile', lang)}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-200"
            aria-label={t('close')}
          >
            ×
          </button>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {pickLang('Lien', 'Enlace', 'Link', lang)}
            </p>
            <p className="mt-2 break-all text-sm font-medium text-stone-900">{profileUrl}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleEmail}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Email
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
            >
              <Copy className="h-4 w-4" aria-hidden />
              {pickLang('Copier', 'Copiar', 'Copy', lang)}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

