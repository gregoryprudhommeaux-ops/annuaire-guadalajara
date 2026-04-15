/**
 * Remplace l’ancien champ texte « hors business » dans le formulaire profil.
 * Source des options : `src/lib/passionConfig.ts`
 */

import { cn } from '../cn';
import type { Language } from '../types';
import {
  PASSIONS_CATEGORIES,
  MAX_PASSIONS,
  PASSION_OPTION_ID_SET,
  getPassionLabel,
} from '../lib/passionConfig';
import { pickLang } from '../lib/uiLocale';

export interface PassionPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  lang: Language;
  t: (key: string) => string;
}

function PassionPicker({ value, onChange, lang, t }: PassionPickerProps) {
  const legacyIds = value.filter((id) => !PASSION_OPTION_ID_SET.has(id));

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (value.length >= MAX_PASSIONS) return;
      onChange([...value, id]);
    }
  };

  return (
    <div className="min-w-0 space-y-4 rounded-xl border border-violet-100 bg-violet-50/40 p-4 md:p-5">
      <div className="flex flex-col gap-y-2 gap-x-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-stone-500">{t('passions')}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-stone-400 break-words hyphens-auto">
            {t('passionsHint')}
          </p>
        </div>
        <span
          className={cn(
            'text-xs font-medium shrink-0',
            value.length >= MAX_PASSIONS ? 'text-violet-600' : 'text-stone-400'
          )}
        >
          {value.length}/{MAX_PASSIONS} — {t('highlightedNeedsCount')}
        </span>
      </div>

      {PASSIONS_CATEGORIES.map((cat) => (
        <div key={cat.id}>
          <p className="mb-2 flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 break-words">
            <span aria-hidden>{cat.emoji}</span>
            <span className="min-w-0">{cat.label[lang]}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {cat.options.map((option) => {
              const isSelected = value.includes(option.id);
              const isDisabled = !isSelected && value.length >= MAX_PASSIONS;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  disabled={isDisabled}
                  className={cn(
                    'max-w-full min-w-0 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-all sm:max-w-[min(100%,260px)]',
                    isSelected
                      ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                      : isDisabled
                        ? 'cursor-not-allowed border-stone-200 bg-stone-50 text-stone-300'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-violet-300 hover:text-violet-700'
                  )}
                >
                  <span className="break-words">{option.label[lang]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {legacyIds.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-3">
          <p className="text-[10px] font-semibold leading-snug text-amber-950">
            {pickLang(
              'Ces centres d’intérêt ne figurent plus au catalogue ; vous pouvez les retirer pour en choisir d’autres.',
              'Estos intereses ya no están en el catálogo; puede quitarlos para elegir otros.',
              'These interests are no longer in the catalog — remove them to pick others.',
              lang
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {legacyIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="max-w-full min-w-0 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-left text-xs font-medium text-amber-950 hover:bg-amber-100"
              >
                <span className="break-words">{getPassionLabel(id, lang)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {value.length >= MAX_PASSIONS && (
        <p className="text-xs text-violet-600 font-medium">{t('passionsMaxReached')}</p>
      )}
    </div>
  );
}

export default PassionPicker;
