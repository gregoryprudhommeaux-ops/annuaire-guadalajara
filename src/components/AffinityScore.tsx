/**
 * Affiché sur la fiche détail d’un membre, en comparaison avec le profil connecté.
 * Données : `highlightedNeeds` + `passionIds` (UserProfile).
 */

import type { UserProfile, Language } from '../types';
import { sanitizeHighlightedNeeds, needOptionLabel } from '../needOptions';
import { sanitizePassionIds, getPassionLabel, getPassionEmoji } from '../lib/passionConfig';

function intersection(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

function firstName(fullName: string): string {
  const p = fullName.trim().split(/\s+/)[0];
  return p || fullName;
}

function buildMeetMessage(
  lang: Language,
  targetName: string,
  passionLabels: string[],
  hasCommonNeeds: boolean
): string {
  const fn = firstName(targetName);
  const passionPart =
    passionLabels.length > 0 ? ` (${passionLabels.join(', ')})` : '';
  const needsPart =
    hasCommonNeeds && lang === 'fr'
      ? ' et des besoins professionnels en commun'
      : hasCommonNeeds && lang === 'es'
        ? ' y necesidades profesionales en común'
        : '';

  if (lang === 'es') {
    return `Hola ${fn} 👋\n\nVi tu perfil en el Directorio de Negocios de Guadalajara y veo que tenemos afinidades${passionPart}${needsPart}. Me encantaría tomar un café o una copa para conocernos. ¿Te parece?`;
  }
  return `Bonjour ${fn} 👋\n\nJ’ai vu ton profil sur l’Annuaire d’Affaires de Guadalajara — nous avons des affinités${passionPart}${needsPart}. Ce serait un plaisir d’échanger autour d’un café ou d’un verre si tu es partant·e !`;
}

export interface AffinityScoreProps {
  viewer: UserProfile;
  target: UserProfile;
  lang: Language;
  t: (key: string) => string;
  /** Même règle que les fiches : WhatsApp si public ou membre connecté. */
  canRevealPrivateWhatsApp: boolean;
}

export default function AffinityScore({
  viewer,
  target,
  lang,
  t,
  canRevealPrivateWhatsApp,
}: AffinityScoreProps) {
  if (viewer.uid === target.uid) return null;

  const viewerNeeds = sanitizeHighlightedNeeds(viewer.highlightedNeeds);
  const targetNeeds = sanitizeHighlightedNeeds(target.highlightedNeeds);
  const commonNeeds = intersection(viewerNeeds, targetNeeds);

  const viewerPassions = sanitizePassionIds(viewer.passionIds);
  const targetPassions = sanitizePassionIds(target.passionIds);
  const commonPassions = intersection(viewerPassions, targetPassions);

  if (commonNeeds.length === 0 && commonPassions.length === 0) return null;

  const needsLabels = commonNeeds.map((id) => needOptionLabel(id, lang));
  const passionLabels = commonPassions.map((id) => getPassionLabel(id, lang));

  const needsHeading =
    commonNeeds.length === 1
      ? t('affinityCommonNeedOne')
      : t('affinityCommonNeedMany').replace('{{n}}', String(commonNeeds.length));

  const waDigits = target.whatsapp?.replace(/\D/g, '') ?? '';
  const canWhatsApp =
    Boolean(waDigits) && (target.isWhatsappPublic || canRevealPrivateWhatsApp);

  const openWhatsApp = () => {
    if (!canWhatsApp) return;
    const msg = encodeURIComponent(
      buildMeetMessage(lang, target.fullName, passionLabels, commonNeeds.length > 0)
    );
    window.open(`https://wa.me/${waDigits}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/80 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 flex items-center gap-1.5 flex-wrap">
        <span aria-hidden>🤝</span>
        <span>
          {t('affinityWith')} <span className="normal-case font-bold text-stone-800">{target.fullName}</span>
        </span>
      </p>

      {commonNeeds.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-sm shrink-0" aria-hidden>
            ✅
          </span>
          <p className="text-sm text-stone-700 min-w-0">
            <span className="font-semibold">{needsHeading}</span>
            <span className="text-stone-500"> — {needsLabels.join(', ')}</span>
          </p>
        </div>
      )}

      {commonPassions.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-sm shrink-0" aria-hidden>
            {getPassionEmoji(commonPassions[0])}
          </span>
          <p className="text-sm text-stone-700 min-w-0">
            <span className="font-semibold">{t('affinityCommonPassions')}</span>
            <span className="text-stone-500"> : {passionLabels.join(', ')}</span>
          </p>
        </div>
      )}

      {canWhatsApp ? (
        <button
          type="button"
          onClick={openWhatsApp}
          className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 shadow-sm"
        >
          💬 {t('affinitySuggestMeet')}
        </button>
      ) : (
        <p className="text-xs text-stone-500 italic">{t('affinityWhatsAppMissing')}</p>
      )}
    </div>
  );
}
