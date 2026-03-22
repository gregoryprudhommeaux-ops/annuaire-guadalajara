import React from 'react';
import type { Language } from '@/types';
import { cn } from '../../cn';
import {
  MAX_PASSIONS,
  PASSIONS_CATEGORIES,
  type PassionLocale,
} from '@/lib/passionConfig';

export type IceBreakerInterestsProps = {
  lang: Language;
  /** ex. `passionIdsDraft` dans le parent */
  value?: string[];
  /** met à jour le draft dans le parent */
  onChange: (ids: string[]) => void;
  maxSelected?: number;
};

/** Emojis par id de passion (fallback : emoji de catégorie dans le rendu). */
const OPTION_ICONS: Record<string, string> = {
  golf: '⛳',
  peche: '🎣',
  padel: '🏓',
  petanque: '⚪',
  randonnee: '🥾',
  surf: '🏄',
  tennis: '🎾',
  cyclisme: '🚴',
  yoga: '🧘',
  natation: '🏊',
  plongee: '🤿',
  escalade: '🧗',
  camping: '🏕️',
  voyage: '✈️',
  moto: '🏍️',
  cuisine: '🍳',
  vins: '🍷',
  gastronomie: '🍽️',
  mixologie: '🍸',
  patisserie: '🧁',
  musique: '🎵',
  cinema: '🎬',
  litterature: '📚',
  art: '🎨',
  photographie: '📷',
  theatre: '🎭',
  startups: '🚀',
  ia: '🤖',
  investissement: '📈',
  crypto: '🪙',
  ecommerce: '🛒',
};

const headerTexts: Record<
  Language,
  { title: string; subtitle: string; counter: string }
> = {
  fr: {
    title: 'En dehors du business : qui es-tu ?',
    subtitle:
      'Choisis jusqu’à 3 centres d’intérêt. Parfait pour briser la glace avec les autres membres.',
    counter: 'sélectionné(s)',
  },
  en: {
    title: 'Beyond business: who are you?',
    subtitle: 'Pick up to 3 interests. Perfect to break the ice with other members.',
    counter: 'selected',
  },
  es: {
    title: 'Fuera del negocio: ¿quién eres?',
    subtitle: 'Elige hasta 3 intereses. Perfecto para romper el hielo con otros miembros.',
    counter: 'seleccionado(s)',
  },
};

const iceBreakerMessages: Record<
  Language,
  { none: string; one: string; two: string; three: string }
> = {
  fr: {
    none: 'Choisis jusqu’à 3 centres d’intérêt.',
    one: 'On commence à te connaître.',
    two: 'On a déjà deux bons sujets pour lancer la discussion.',
    three: 'Parfait, tu es prêt(e) pour le prochain afterwork.',
  },
  en: {
    none: 'Pick up to 3 interests.',
    one: 'We’re starting to get to know you.',
    two: 'We already have two great conversation starters.',
    three: 'Perfect, you’re ready for the next meetup.',
  },
  es: {
    none: 'Elige hasta 3 intereses.',
    one: 'Empezamos a conocerte.',
    two: 'Ya tenemos dos buenos temas de conversación.',
    three: 'Perfecto, listo/a para el próximo afterwork.',
  },
};

function getIceBreakerText(lang: Language, count: number) {
  const msgs = iceBreakerMessages[lang] ?? iceBreakerMessages.fr;
  if (count === 0) return msgs.none;
  if (count === 1) return msgs.one;
  if (count === 2) return msgs.two;
  return msgs.three;
}

/**
 * Sélecteur de passions « ice breaker » : mêmes ids que {@link PASSIONS_CATEGORIES} / `passionIds` Firestore.
 * Variante UX du `PassionPicker` (titre, compteur, message dynamique, emoji par tag).
 */
/** 100 % contrôlé : pas d’état local, seulement `value` + `onChange`. */
export function IceBreakerInterests({
  lang,
  value,
  onChange,
  maxSelected = MAX_PASSIONS,
}: IceBreakerInterestsProps) {
  const selected = value ?? [];
  const locale = lang as PassionLocale;
  const header = headerTexts[lang] ?? headerTexts.fr;
  const count = selected.length;
  const isMax = count >= maxSelected;

  const toggleInterest = (id: string) => {
    const isSelected = selected.includes(id);
    if (isSelected) {
      onChange(selected.filter((x) => x !== id));
    } else {
      if (selected.length >= maxSelected) return;
      onChange([...selected, id]);
    }
  };

  return (
    <section className="mt-6 min-w-0 rounded-2xl border border-gray-100 bg-white p-4 md:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 break-words">{header.title}</h3>
          <p className="mt-1 text-xs text-gray-500 md:text-sm break-words hyphens-auto">
            {header.subtitle}
          </p>
        </div>
        <div
          className={cn(
            'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium',
            isMax ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
          )}
        >
          {count}/{maxSelected} — {header.counter}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {PASSIONS_CATEGORIES.map((cat) => (
          <div key={cat.id} className="flex flex-col gap-2">
            <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <span aria-hidden>{cat.emoji}</span>
              <span className="min-w-0 break-words">{cat.label[locale]}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {cat.options.map((option) => {
                const active = selected.includes(option.id);
                const disabled = !active && isMax;
                const icon = OPTION_ICONS[option.id] ?? cat.emoji;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleInterest(option.id)}
                    disabled={disabled}
                    className={cn(
                      'inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border px-3 py-1.5 text-left text-xs transition md:text-sm',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1',
                      active
                        ? 'scale-[1.02] border-violet-500 bg-violet-600 text-white shadow-sm'
                        : disabled
                          ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50'
                    )}
                  >
                    <span aria-hidden>{icon}</span>
                    <span className="break-words">{option.label[locale]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p
        className={cn(
          'mt-3 text-xs md:text-sm',
          isMax ? 'text-emerald-600' : 'text-gray-500'
        )}
      >
        {getIceBreakerText(lang, count)}
      </p>
    </section>
  );
}

export default IceBreakerInterests;
