import { cn } from '@/lib/cn';
import { normalizeGeo } from '@/lib/geoDirectory';
import type { CompanyActivitySlot, Language, UserProfile } from '@/types';
import { pickLang } from '@/lib/uiLocale';
import { PROFILE_FIELD_LABELS } from '@/features/profile/utils/profileFieldLabels';
import { PROFILE_FIELD_HELP } from '@/features/profile/utils/profileFieldHelp';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';

type Props = {
  lang: Language;
  t: (key: string) => string;
  pickLang: typeof pickLang;
  profileEditFrUx: boolean;
  isEditProfileRoute: boolean;
  /** Fiche enregistrée (ou celle éditée par l’admin). */
  savedProfile: UserProfile | null;
  firstSlot: CompanyActivitySlot | undefined;
  onSyncFromSavedProfile: () => void;
  /** L’admin édite un autre membre : formulations au « il/elle ». */
  editingSomeoneElse: boolean;
};

function slotGeoPreview(slot: CompanyActivitySlot | undefined): string | null {
  if (!slot) return null;
  const city = String(slot.city ?? '').trim();
  const state = String(slot.state ?? '').trim();
  const country = String(slot.country ?? '').trim();
  if (!city || !state || !country) return null;
  return `${city} · ${state} · ${country}`;
}

export function ProfileCommunityPrimaryBanner({
  lang,
  t,
  pickLang,
  profileEditFrUx,
  isEditProfileRoute,
  savedProfile,
  firstSlot,
  onSyncFromSavedProfile,
  editingSomeoneElse,
}: Props) {
  const savedGeo = savedProfile ? normalizeGeo(savedProfile) : null;
  const fromSlot = slotGeoPreview(firstSlot);
  const previewLine =
    fromSlot ??
    (savedGeo ? `${savedGeo.city} · ${savedGeo.state} · ${savedGeo.country}` : null);

  const title = profileEditFrUx
    ? PROFILE_FIELD_LABELS.networkCommunityPrimary
    : t('profileCommunityPrimaryTitle');
  const body = profileEditFrUx
    ? PROFILE_FIELD_HELP.networkCommunityPrimary
    : t('profileCommunityPrimaryBody');

  const previewLabel = pickLang(
    editingSomeoneElse
      ? 'Lieu utilisé pour sa fiche sur /network (aperçu) :'
      : 'Lieu utilisé pour votre fiche sur /network (aperçu) :',
    editingSomeoneElse
      ? 'Ubicación de su ficha en /network (vista previa):'
      : 'Ubicación de tu ficha en /network (vista previa):',
    editingSomeoneElse ? 'Location on /network for this profile (preview):' : 'Location on /network for your profile (preview):',
    lang
  );

  const emptyPreview = pickLang('À compléter dans le 1er bloc « Société » ci‑dessous.', 'Completa el 1er bloque « Empresa » abajo.', 'Complete the 1st “Company” block below.', lang);

  const cta = profileEditFrUx
    ? PROFILE_FIELD_LABELS.networkCommunitySyncCta
    : t('profileCommunityPrimarySyncCta');

  const ctaHint = profileEditFrUx
    ? PROFILE_FIELD_HELP.networkCommunitySync ?? t('profileCommunityPrimarySyncHint')
    : t('profileCommunityPrimarySyncHint');

  const canSync = Boolean(savedGeo && firstSlot?.id);

  return (
    <section
      id="profile-completion-communityPrimary"
      className={cn(
        'space-y-3 rounded-xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm ring-1 ring-slate-900/5 sm:p-5',
        isEditProfileRoute && 'profile-stack-md'
      )}
      aria-labelledby="profile-community-primary-heading"
    >
      <h2
        id="profile-community-primary-heading"
        className="m-0 text-sm font-semibold tracking-tight text-slate-900 sm:text-[0.95rem]"
      >
        {title}
      </h2>
      <p className="m-0 text-xs leading-relaxed text-slate-700">{body}</p>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{previewLabel}</p>
        <p className="mt-1 text-sm font-medium text-slate-900">{previewLine ?? emptyPreview}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canSync}
          onClick={onSyncFromSavedProfile}
          className={cn(
            'inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50',
            !canSync && 'cursor-not-allowed opacity-45'
          )}
        >
          {cta}
        </button>
      </div>
      <ProfileFieldHint>{ctaHint}</ProfileFieldHint>
    </section>
  );
}
