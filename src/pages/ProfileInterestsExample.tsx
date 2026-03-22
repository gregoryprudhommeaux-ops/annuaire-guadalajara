/**
 * Exemple autonome pour `IceBreakerInterests` (même flux que `passionIds` / Firestore).
 * La route `/profil/:profileId` utilise un autre composant nommé `ProfilePage` dans App.tsx.
 */
import React, { useState } from 'react';
import type { Language } from '@/types';
import { IceBreakerInterests } from '@/components/profile/IceBreakerInterests';
import { sanitizePassionIds } from '@/lib/passionConfig';

const LANGS: Language[] = ['fr', 'en', 'es'];

const ProfileInterestsExample: React.FC = () => {
  const [lang, setLang] = useState<Language>('fr');
  const [interests, setInterests] = useState<string[]>([]);

  const handleChangeInterests = (ids: string[]) => {
    setInterests(sanitizePassionIds(ids));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex gap-2">
        {LANGS.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`rounded-full px-3 py-1 text-xs ${
              lang === code ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
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
