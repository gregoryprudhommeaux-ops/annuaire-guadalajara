/**
 * Remplace l’ancien champ texte « hors business » dans le formulaire profil.
 * Source des options : `src/lib/passionConfig.ts`
 */

import { cn } from '../cn';
import type { Language } from '../types';
import { PASSIONS_CATEGORIES, MAX_PASSIONS } from '../lib/passionConfig';

export interface PassionPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  lang: Language;
  t: (key: string) => string;
}

function PassionPicker({ value, onChange, lang, t }: PassionPickerProps) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (value.length >= MAX_PASSIONS) return;
      onChange([...value, id]);
    }
  };

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4 md:p-5 space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between gap-y-2">
        <div>
          <p className="text-xs font-semibold text-stone-500 tracking-wide">{t('passions')}</p>
          <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">{t('passionsHint')}</p>
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
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <span aria-hidden>{cat.emoji}</span>
            {cat.label[lang]}
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
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-all border max-w-[260px] text-left',
                    isSelected
                      ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                      : isDisabled
                        ? 'cursor-not-allowed border-stone-200 bg-stone-50 text-stone-300'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-violet-300 hover:text-violet-700'
                  )}
                >
                  {option.label[lang]}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {value.length >= MAX_PASSIONS && (
        <p className="text-xs text-violet-600 font-medium">{t('passionsMaxReached')}</p>
      )}
    </div>
  );
}

export default PassionPicker;
