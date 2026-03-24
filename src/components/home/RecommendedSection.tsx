import React from 'react';
import { cn } from '../../cn';
import { cardPad } from '../../lib/pageLayout';

type TFn = (key: string) => string;

type Props = {
  t: TFn;
  /** Moins de 3 autres membres dans l’annuaire : message + CTA invitation. */
  needsInviteGate: boolean;
  onInviteClick: () => void;
  /** Grille de cartes / chargement / autres états vides (matchmaker). */
  children: React.ReactNode;
};

/**
 * Bloc « Recommandé pour vous » : état vide orienté invitation si peu de membres,
 * sinon contenu (liste IA) fourni par `children`.
 */
export default function RecommendedSection({
  t,
  needsInviteGate,
  onInviteClick,
  children,
}: Props) {
  return (
    <section
      className={cn(
        'recommended-section min-w-0 rounded-2xl border border-stone-200 bg-white shadow-sm',
        cardPad,
        'space-y-4'
      )}
    >
      <h2 className="text-lg font-bold leading-snug tracking-tight text-stone-900 break-words">
        {t('recommendedForYou')}
      </h2>

      {needsInviteGate ? (
        <div className="empty-state space-y-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-6 sm:px-6">
          <p className="text-center text-sm leading-relaxed text-stone-600">{t('aiRecInviteEmptyBody')}</p>
          <p className="empty-benefit text-center text-sm font-medium leading-relaxed text-stone-700">
            {t('aiRecInviteEmptyBenefit')}
          </p>
          <div className="flex justify-center pt-1">
            <button
              type="button"
              data-testid="ai-rec-invite-cta"
              className={cn(
                'btn-primary rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors',
                'hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700'
              )}
              onClick={onInviteClick}
            >
              {t('aiRecInviteCta')}
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
