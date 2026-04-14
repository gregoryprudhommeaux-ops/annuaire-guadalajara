/**
 * Brouillon du formulaire profil sur l’appareil (sessionStorage) : rechargement, lien e-mail, etc.
 * Ne remplace pas Firestore ; évite de tout ressaisir si la page se recharge avant enregistrement.
 */
import type { CompanyActivitySlot } from '@/types';

export const PROFILE_FORM_DRAFT_SCHEMA_VERSION = 1;

const draftKey = (uid: string) =>
  `annuaire_profile_draft_v${PROFILE_FORM_DRAFT_SCHEMA_VERSION}_${uid}`;
const lastSaveKey = (uid: string) => `annuaire_profile_last_save_ms_${uid}`;

export type ProfileFormDraftStored = {
  v: number;
  savedAt: number;
  texts: Record<string, string>;
  checks: Record<string, boolean>;
  passionIds: string[];
  highlightedNeeds: string[];
  workingLanguageCodes: string[];
  companyActivities: CompanyActivitySlot[];
  companyActivityEditCollapsed: Record<string, boolean>;
  profilePhotoUrlDraft: string;
};

const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function loadProfileFormDraft(uid: string): ProfileFormDraftStored | null {
  if (typeof window === 'undefined' || !uid) return null;
  try {
    const raw = sessionStorage.getItem(draftKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileFormDraftStored;
    if (parsed.v !== PROFILE_FORM_DRAFT_SCHEMA_VERSION || typeof parsed.savedAt !== 'number') {
      return null;
    }
    if (Date.now() - parsed.savedAt > MAX_DRAFT_AGE_MS) {
      sessionStorage.removeItem(draftKey(uid));
      return null;
    }
    if (!parsed.texts || typeof parsed.texts !== 'object') parsed.texts = {};
    if (!parsed.checks || typeof parsed.checks !== 'object') parsed.checks = {};
    if (!Array.isArray(parsed.passionIds)) parsed.passionIds = [];
    if (!Array.isArray(parsed.highlightedNeeds)) parsed.highlightedNeeds = [];
    if (!Array.isArray(parsed.workingLanguageCodes)) parsed.workingLanguageCodes = [];
    if (!Array.isArray(parsed.companyActivities)) parsed.companyActivities = [];
    if (!parsed.companyActivityEditCollapsed || typeof parsed.companyActivityEditCollapsed !== 'object') {
      parsed.companyActivityEditCollapsed = {};
    }
    if (typeof parsed.profilePhotoUrlDraft !== 'string') parsed.profilePhotoUrlDraft = '';
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfileFormDraft(uid: string, payload: Omit<ProfileFormDraftStored, 'v' | 'savedAt'>): void {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const data: ProfileFormDraftStored = {
      v: PROFILE_FORM_DRAFT_SCHEMA_VERSION,
      savedAt: Date.now(),
      ...payload,
    };
    sessionStorage.setItem(draftKey(uid), JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function clearProfileFormDraft(uid: string): void {
  if (typeof window === 'undefined' || !uid) return;
  try {
    sessionStorage.removeItem(draftKey(uid));
  } catch {
    /* ignore */
  }
}

/** Horodatage du dernier enregistrement réussi (ce navigateur). */
export function getLastProfileSaveMs(uid: string): number {
  if (typeof window === 'undefined' || !uid) return 0;
  try {
    const v = sessionStorage.getItem(lastSaveKey(uid));
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

/**
 * Si jamais défini, ancrer sur la création Firestore du profil pour qu’un brouillon récent
 * après édition puisse être restauré même avant un premier « Enregistrer » sur cet appareil.
 */
export function initLastProfileSaveBaselineIfUnset(uid: string, profileCreatedAtMs: number): void {
  if (typeof window === 'undefined' || !uid) return;
  try {
    if (sessionStorage.getItem(lastSaveKey(uid))) return;
    sessionStorage.setItem(lastSaveKey(uid), String(profileCreatedAtMs));
  } catch {
    /* ignore */
  }
}

export function markProfileSavedOk(uid: string): void {
  if (typeof window === 'undefined' || !uid) return;
  try {
    sessionStorage.setItem(lastSaveKey(uid), String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function shouldRestoreProfileDraft(
  draft: ProfileFormDraftStored,
  uid: string,
  hasFirestoreProfile: boolean
): boolean {
  if (Date.now() - draft.savedAt > MAX_DRAFT_AGE_MS) return false;
  if (!hasFirestoreProfile) return true;
  const lastSave = getLastProfileSaveMs(uid);
  return draft.savedAt > lastSave;
}
