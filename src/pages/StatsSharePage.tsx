import React, { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { Language } from '@/types';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { useLanguage } from '@/i18n/LanguageProvider';
import { StatsVitrineContent } from '@/pages/StatsVitrineContent';
import francoLogoUrl from '../../favicon.svg?url';

function isLang(v: string | null): v is Language {
  return v === 'fr' || v === 'en' || v === 'es';
}

/**
 * Vitrine publique sans shell app : lien partageable, lecture sans connexion (guest inclus).
 */
export default function StatsSharePage() {
  const { lang, setLang } = useLanguage();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const q = params.get('lang');
    if (isLang(q) && q !== lang) setLang(q);
  }, [params, lang, setLang]);

  const handleLangChange = (next: Language) => {
    setLang(next);
    navigate(`/stats/share?lang=${next}`, { replace: true });
  };

  return (
    <div className="min-h-screen min-w-0 bg-[#f4f6f7]">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:pt-8">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-inherit no-underline motion-safe:hover:opacity-90"
          >
            <img src={francoLogoUrl} alt="FrancoNetwork" className="h-8 w-8" width={32} height={32} />
            <span className="text-sm font-extrabold tracking-tight text-[#01696f]">FrancoNetwork</span>
          </Link>
          <LanguageSwitch value={lang} onChange={handleLangChange} />
        </div>
      </div>
      <StatsVitrineContent variant="share" />
    </div>
  );
}
