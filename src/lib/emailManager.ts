import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/firebase';

export type AudienceFilter =
  | { type: 'all' }
  | { type: 'incomplete'; threshold?: number }
  | { type: 'manual'; emails: string[] };

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'failed';

export type CampaignDoc = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  audience: AudienceFilter;
  status: CampaignStatus;
  scheduledAt: Timestamp | null;
  sentAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
  stats?: {
    recipients: number;
    succeeded: number;
    failed: number;
  };
  lastError?: string | null;
};

export type EmailTemplateDoc = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
};

const TEMPLATES = 'emailTemplates';
const CAMPAIGNS = 'emailCampaigns';

export function subscribeToTemplates(
  cb: (templates: EmailTemplateDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, TEMPLATES), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EmailTemplateDoc, 'id'>) }))
      );
    },
    (err) => onError?.(err)
  );
}

export function subscribeToCampaigns(
  cb: (campaigns: CampaignDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, CAMPAIGNS), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CampaignDoc, 'id'>) }))
      );
    },
    (err) => onError?.(err)
  );
}

export async function createTemplate(input: {
  name: string;
  subject: string;
  bodyHtml: string;
  createdBy: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, TEMPLATES), {
    name: input.name,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: input.createdBy,
  });
  return ref.id;
}

export async function updateTemplate(
  id: string,
  patch: Partial<Pick<EmailTemplateDoc, 'name' | 'subject' | 'bodyHtml'>>
): Promise<void> {
  await updateDoc(doc(db, TEMPLATES, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, TEMPLATES, id));
}

export async function createCampaign(input: {
  name: string;
  subject: string;
  bodyHtml: string;
  audience: AudienceFilter;
  scheduledAt?: Date | null;
  createdBy: string;
}): Promise<string> {
  const status: CampaignStatus = input.scheduledAt ? 'scheduled' : 'draft';
  const ref = await addDoc(collection(db, CAMPAIGNS), {
    name: input.name,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    audience: input.audience,
    status,
    scheduledAt: input.scheduledAt ? Timestamp.fromDate(input.scheduledAt) : null,
    sentAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: input.createdBy,
    lastError: null,
  });
  return ref.id;
}

export async function updateCampaign(
  id: string,
  patch: Partial<{
    name: string;
    subject: string;
    bodyHtml: string;
    audience: AudienceFilter;
    scheduledAt: Date | null;
    status: CampaignStatus;
  }>
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if ('name' in patch) data.name = patch.name;
  if ('subject' in patch) data.subject = patch.subject;
  if ('bodyHtml' in patch) data.bodyHtml = patch.bodyHtml;
  if ('audience' in patch) data.audience = patch.audience;
  if ('status' in patch) data.status = patch.status;
  if ('scheduledAt' in patch) {
    data.scheduledAt = patch.scheduledAt
      ? Timestamp.fromDate(patch.scheduledAt)
      : null;
  }
  await updateDoc(doc(db, CAMPAIGNS, id), data);
}

export async function deleteCampaign(id: string): Promise<void> {
  await deleteDoc(doc(db, CAMPAIGNS, id));
}

export type SendCampaignResult = {
  ok: boolean;
  recipients: number;
  succeeded: number;
  failed: number;
};

export async function sendCampaignNowCallable(
  campaignId: string
): Promise<SendCampaignResult> {
  const fn = httpsCallable<{ campaignId: string }, SendCampaignResult>(
    functions,
    'sendCampaignNow'
  );
  const res = await fn({ campaignId });
  return res.data;
}

export const DEFAULT_TEST_EMAIL = 'gregory.prudhommeaux@gmail.com';

export type SendCampaignTestResult = {
  ok: boolean;
  to: string;
  id: string | null;
};

export type SendCampaignTestInput = {
  subject: string;
  bodyHtml: string;
  name?: string;
  to?: string;
};

export async function sendCampaignTestCallable(
  input: SendCampaignTestInput
): Promise<SendCampaignTestResult> {
  const fn = httpsCallable<SendCampaignTestInput, SendCampaignTestResult>(
    functions,
    'sendCampaignTest'
  );
  const res = await fn(input);
  return res.data;
}

// ============================================================================
// EMAIL AUTOMATIONS — synchro logique avec functions/src/lib/automations.ts
// ============================================================================

export type AutomationTrigger = 'userCreated' | 'weeklySchedule';

export const AUTOMATION_TRIGGERS: {
  id: AutomationTrigger;
  label: string;
  description: string;
}[] = [
  {
    id: 'userCreated',
    label: 'Nouvel inscrit',
    description:
      'Envoyé automatiquement à chaque nouveau compte créé sur FrancoNetwork.',
  },
  {
    id: 'weeklySchedule',
    label: 'Récap hebdo (lundi 9h)',
    description:
      'Envoyé chaque lundi à 9h (heure de Guadalajara) à tous les membres ayant un email valide.',
  },
];

/**
 * Variables disponibles dans le sujet et le corps des automations.
 * Source synchronisée avec `functions/src/lib/templateVars.ts:AVAILABLE_VARS`.
 */
export const AUTOMATION_VARIABLES: { name: string; description: string }[] = [
  { name: 'firstName', description: 'Prénom du destinataire' },
  { name: 'fullName', description: 'Nom complet' },
  { name: 'displayName', description: 'Nom d\'affichage' },
  { name: 'email', description: 'Adresse email' },
  { name: 'companyName', description: 'Société (si renseignée)' },
  { name: 'appUrl', description: 'URL de l\'app' },
  { name: 'profileEditUrl', description: 'Lien vers /profile/edit' },
  { name: 'networkUrl', description: 'Lien vers /network' },
  { name: 'completionRate', description: 'Taux de complétion (0-100)' },
  { name: 'completionPercent', description: 'Taux de complétion avec %' },
];

/** Langue cible d'une automation (`null` = toutes). */
export type AutomationLanguage = 'fr' | 'es' | 'en' | null;

export type AutomationDoc = {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  enabled: boolean;
  subject: string;
  bodyHtml: string;
  /**
   * Si défini, restreint l'envoi aux destinataires dont
   * `users/{uid}.communicationLanguage` correspond.
   * `null` ou absent = toutes langues.
   */
  targetLanguage?: AutomationLanguage;
  delayMinutes?: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  updatedBy: string;
};

const AUTOMATIONS = 'emailAutomations';

export function subscribeToAutomations(
  cb: (rows: AutomationDoc[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, AUTOMATIONS), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AutomationDoc, 'id'>),
        }))
      );
    },
    (err) => onError?.(err)
  );
}

export async function createAutomation(input: {
  name: string;
  trigger: AutomationTrigger;
  enabled: boolean;
  subject: string;
  bodyHtml: string;
  targetLanguage?: AutomationLanguage;
  updatedBy: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, AUTOMATIONS), {
    name: input.name,
    trigger: input.trigger,
    enabled: input.enabled,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    targetLanguage: input.targetLanguage ?? null,
    delayMinutes: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: input.updatedBy,
  });
  return ref.id;
}

export async function updateAutomation(
  id: string,
  patch: Partial<
    Pick<
      AutomationDoc,
      | 'name'
      | 'trigger'
      | 'enabled'
      | 'subject'
      | 'bodyHtml'
      | 'delayMinutes'
      | 'targetLanguage'
    >
  > & { updatedBy?: string }
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if ('name' in patch) data.name = patch.name;
  if ('trigger' in patch) data.trigger = patch.trigger;
  if ('enabled' in patch) data.enabled = patch.enabled;
  if ('subject' in patch) data.subject = patch.subject;
  if ('bodyHtml' in patch) data.bodyHtml = patch.bodyHtml;
  if ('delayMinutes' in patch) data.delayMinutes = patch.delayMinutes;
  if ('targetLanguage' in patch) data.targetLanguage = patch.targetLanguage ?? null;
  if (patch.updatedBy) data.updatedBy = patch.updatedBy;
  await updateDoc(doc(db, AUTOMATIONS, id), data);
}

export async function deleteAutomation(id: string): Promise<void> {
  await deleteDoc(doc(db, AUTOMATIONS, id));
}

export type SendAutomationTestInput = {
  subject: string;
  bodyHtml: string;
  name?: string;
  to?: string;
};

export type SendAutomationTestResult = {
  ok: boolean;
  to: string;
  id: string | null;
};

export async function sendAutomationTestCallable(
  input: SendAutomationTestInput
): Promise<SendAutomationTestResult> {
  const fn = httpsCallable<SendAutomationTestInput, SendAutomationTestResult>(
    functions,
    'sendAutomationTest'
  );
  const res = await fn(input);
  return res.data;
}

/**
 * Interrupteur maître par déclencheur — doc `appConfig/emailAutomations`.
 * Champ absent ou `true` → déclencheur actif (comportement par défaut).
 * `false` → on saute tout (ni hardcodé, ni automation Firestore).
 */
export type AutomationSettings = Record<AutomationTrigger, boolean>;

const APP_CONFIG_AUTOMATIONS = 'appConfig/emailAutomations';

const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  userCreated: true,
  weeklySchedule: true,
};

export function subscribeToAutomationSettings(
  cb: (settings: AutomationSettings) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, APP_CONFIG_AUTOMATIONS),
    (snap) => {
      const data = (snap.exists() ? snap.data() : null) as
        | Partial<AutomationSettings>
        | null;
      cb({
        userCreated: data?.userCreated !== false,
        weeklySchedule: data?.weeklySchedule !== false,
      });
    },
    (err) => onError?.(err)
  );
}

export async function setAutomationTriggerEnabled(
  trigger: AutomationTrigger,
  enabled: boolean
): Promise<void> {
  await setDoc(
    doc(db, APP_CONFIG_AUTOMATIONS),
    { [trigger]: enabled, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export { DEFAULT_AUTOMATION_SETTINGS };
