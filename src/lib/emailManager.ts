import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
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
