import React, { useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { StatsVitrineContent } from '@/pages/StatsVitrineContent';

export default function StatsPage() {
  const { lang } = useLanguage();
  const sharePageUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/stats/share?lang=${lang}`;
    return `${window.location.origin}/stats/share?lang=${lang}`;
  }, [lang]);

  return <StatsVitrineContent variant="app" sharePageUrl={sharePageUrl} />;
}
