/**
 * Exemple autonome pour `IceBreakerInterests` (même flux que `passionIds` / Firestore).
 * La route `/profil/:profileId` utilise un autre composant nommé `ProfilePage` dans App.tsx.
 */
import React, { useState } from 'react';
import type { Language } from '@/types';
import { IceBreakerInterests } from '@/components/profile/IceBreakerInterests';
import { sanitizePassionIds } from '@/lib/passionConfig';
import { cn } from '@/cn';
import { pagePadX } from '@/lib/pageLayout';

const LANGS: Language[] = ['fr', 'en', 'es'];

const ProfileInterestsExample: React.FC = () => {
  const [lang, setLang] = useState<Language>('fr');
  const [interests, setInterests] = useState<string[]>([]);

  const handleChangeInterests = (ids: string[]) => {
    setInterests(sanitizePassionIds(ids));
  };

  return (
    <div className={cn('mx-auto max-w-4xl py-6', pagePadX)}>
      <div className="mb-4 flex gap-2">
        {LANGS.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              lang === code
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
            )}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      <IceBreakerInterests lang={lang} value={interests} onChange={handleChangeInterests} />
    </div>
  );
};

export default ProfileInterestsExample;
