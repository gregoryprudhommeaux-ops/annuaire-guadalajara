import React from 'react';
import type { UserProfile } from '@/types';

export type ProfileEditOptimizationCalloutProps = {
  show: boolean;
  lang: 'fr' | 'es' | 'en';
  pickLang: (fr: string, es: string, en: string, lang: 'fr' | 'es' | 'en') => string;
  profile: UserProfile;
  onApply: () => void;
};

export default function ProfileEditOptimizationCallout({
  show,
  lang,
  pickLang,
  profile,
  onApply,
}: ProfileEditOptimizationCalloutProps) {
  if (!show) return null;
  const summary = profile.optimizationSuggestion?.summary ?? [];
  return (
    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
      <p className="text-xs font-bold text-indigo-900">
        {pickLang(
          'Suggestions IA disponibles pour optimiser votre profil avant validation.',
          'Sugerencias IA disponibles para optimizar tu perfil antes de la validación.',
          'AI suggestions are available to improve your profile before validation.',
          lang
        )}
      </p>
      <ul className="text-xs text-indigo-800 list-disc pl-4 space-y-1">
        {summary.slice(0, 4).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApply}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
        >
          {pickLang('Appliquer les suggestions IA', 'Aplicar sugerencias IA', 'Apply AI suggestions', lang)}
        </button>
      </div>
    </div>
  );
}

