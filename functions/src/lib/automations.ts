import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { FIRESTORE_DATABASE_ID } from '../constants';

/** Déclencheurs supportés. Synchronisé avec `src/lib/emailManager.ts` côté front. */
export type AutomationTrigger = 'userCreated' | 'weeklySchedule';

export type AutomationDoc = {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  enabled: boolean;
  subject: string;
  bodyHtml: string;
  /** Délai d'envoi après le déclenchement (réservé, non implémenté côté functions). */
  delayMinutes?: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  updatedBy?: string;
};

const COLLECTION = 'emailAutomations';

/**
 * Charge toutes les automations actives pour un déclencheur donné.
 * Les docs vides (sujet ou corps manquant) sont filtrés silencieusement.
 */
export async function loadEnabledAutomations(
  trigger: AutomationTrigger
): Promise<AutomationDoc[]> {
  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  const snap = await db
    .collection(COLLECTION)
    .where('trigger', '==', trigger)
    .where('enabled', '==', true)
    .get();

  const out: AutomationDoc[] = [];
  snap.forEach((doc) => {
    const d = doc.data() as Omit<AutomationDoc, 'id'>;
    const subject = String(d.subject ?? '').trim();
    const bodyHtml = String(d.bodyHtml ?? '');
    if (!subject || !bodyHtml.trim()) return;
    out.push({ id: doc.id, ...d, subject, bodyHtml });
  });
  return out;
}

/**
 * Indique si AU MOINS un document existe pour ce déclencheur (peu importe
 * `enabled`). Sert à savoir s'il faut tomber sur le fallback hardcodé :
 *  - 0 doc → fallback hardcodé (comportement historique)
 *  - 1+ doc → mode Firestore (admin a pris le contrôle, on respecte enabled)
 */
export async function hasAutomationFor(
  trigger: AutomationTrigger
): Promise<boolean> {
  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  const snap = await db
    .collection(COLLECTION)
    .where('trigger', '==', trigger)
    .limit(1)
    .get();
  return !snap.empty;
}

/** Lecture d'une automation par id (pour le test depuis l'UI). */
export async function getAutomationById(
  id: string
): Promise<AutomationDoc | null> {
  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  const d = snap.data() as Omit<AutomationDoc, 'id'>;
  return { id: snap.id, ...d };
}

/**
 * Interrupteur maître par déclencheur — stocké dans `appConfig/emailAutomations`.
 * Si le doc ou le champ est absent, on considère l'envoi comme ACTIVÉ par défaut
 * (préserve le comportement historique).
 */
export type AutomationSettings = Record<AutomationTrigger, boolean>;

const SETTINGS_PATH = 'appConfig/emailAutomations';

export async function isTriggerEnabled(
  trigger: AutomationTrigger
): Promise<boolean> {
  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  const snap = await db.doc(SETTINGS_PATH).get();
  if (!snap.exists) return true;
  const d = snap.data() as Partial<AutomationSettings> | undefined;
  const v = d?.[trigger];
  return v !== false;
}
