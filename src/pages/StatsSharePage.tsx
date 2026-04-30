import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Language } from '@/types';
import { LanguageSwitch } from '@/components/layout/LanguageSwitch';
import { useLanguage } from '@/i18n/LanguageProvider';
import { StatsVitrineContent } from '@/pages/StatsVitrineContent';

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
      <StatsVitrineContent
        variant="share"
        shareTopRight={<LanguageSwitch value={lang} onChange={handleLangChange} />}
      />
    </div>
  );
}
