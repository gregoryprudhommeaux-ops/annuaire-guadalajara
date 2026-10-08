import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { logger } from 'firebase-functions/v2';
import { defineString } from 'firebase-functions/params';
import { FIRESTORE_DATABASE_ID } from '../constants';

const LA_MESA_IMPORT_URL = defineString('LA_MESA_IMPORT_URL', {
  default: 'https://lamesasecreta.com/api/admin/import/franconetwork',
});
const LA_MESA_IMPORT_SECRET = defineString('LA_MESA_IMPORT_SECRET', { default: '' });
const DATABASE_PERSO_BASE_URL = defineString('DATABASE_PERSO_BASE_URL', { default: '' });
const DATABASE_PERSO_API_TOKEN = defineString('DATABASE_PERSO_API_TOKEN', { default: '' });

type FnUserPayload = {
  fullName?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  companyName?: unknown;
  activityCategory?: unknown;
  positionCategory?: unknown;
  city?: unknown;
  linkedin?: unknown;
  networkGoal?: unknown;
  memberBio?: unknown;
  helpNewcomers?: unknown;
  bio?: unknown;
  communicationLanguage?: unknown;
  isValidated?: unknown;
  onboardingSource?: unknown;
  laMesaWaitlistSyncedAt?: unknown;
  databasePersoContacterSyncedAt?: unknown;
};

function asStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function buildLaMesaBody(data: FnUserPayload) {
  return {
    fullName: asStr(data.fullName),
    email: asStr(data.email).toLowerCase(),
    whatsapp: asStr(data.whatsapp) || undefined,
    companyName: asStr(data.companyName) || undefined,
    activityCategory: asStr(data.activityCategory) || undefined,
    positionCategory: asStr(data.positionCategory) || undefined,
    city: asStr(data.city) || undefined,
    linkedin: asStr(data.linkedin) || undefined,
    networkGoal: asStr(data.networkGoal) || undefined,
    memberBio: asStr(data.memberBio) || undefined,
    helpNewcomers: asStr(data.helpNewcomers) || undefined,
    bio: asStr(data.bio) || undefined,
    communicationLanguage: asStr(data.communicationLanguage) || undefined,
    isValidated: typeof data.isValidated === 'boolean' ? data.isValidated : null,
  };
}

async function pushToDatabasePersoContacter(uid: string, data: FnUserPayload): Promise<boolean> {
  const baseUrl = DATABASE_PERSO_BASE_URL.value().trim().replace(/\/$/, '');
  const token = DATABASE_PERSO_API_TOKEN.value().trim();
  if (!baseUrl || !token) {
    logger.warn('DATABASE_PERSO_* missing — skip Perso CONTACTER sync', { uid });
    return false;
  }

  const email = asStr(data.email).toLowerCase();
  const fullName = asStr(data.fullName);
  if (!email || !fullName) {
    logger.info('FN profile incomplete for Perso CONTACTER, skip', { uid });
    return false;
  }

  const res = await fetch(`${baseUrl}/api/public/lists/la-mesa/add-to-contacter`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email,
      fullName,
      company: asStr(data.companyName) || undefined,
      phone: asStr(data.whatsapp) || undefined,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    contactId?: string;
    error?: string;
    message?: string;
  };

  if (!res.ok || !json.ok) {
    logger.error('Database Perso CONTACTER sync failed', {
      uid,
      status: res.status,
      body: json,
    });
    return false;
  }

  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  await db.doc(`users/${uid}`).set(
    {
      databasePersoContacterSyncedAt: FieldValue.serverTimestamp(),
      databasePersoContactId: json.contactId || null,
    },
    { merge: true }
  );

  logger.info('Database Perso CONTACTER sync ok', {
    uid,
    email,
    contactId: json.contactId,
  });
  return true;
}

async function pushToLaMesa(uid: string, data: FnUserPayload): Promise<boolean> {
  const secret = LA_MESA_IMPORT_SECRET.value().trim();
  const url = LA_MESA_IMPORT_URL.value().trim();
  if (!secret) {
    logger.warn('LA_MESA_IMPORT_SECRET missing — skip LA MESA sync', { uid });
    return false;
  }
  if (!url) {
    logger.warn('LA_MESA_IMPORT_URL missing — skip LA MESA sync', { uid });
    return false;
  }

  const body = buildLaMesaBody(data);
  if (!body.email || !body.fullName) {
    logger.info('FN profile incomplete for LA MESA sync, skip', {
      uid,
      hasEmail: Boolean(body.email),
      hasName: Boolean(body.fullName),
    });
    return false;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-franconetwork-import-secret': secret,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    status?: string;
    reason?: string;
    error?: string;
  };

  if (!res.ok || !json.ok) {
    logger.error('LA MESA import failed', {
      uid,
      status: res.status,
      body: json,
    });
    return false;
  }

  // already_active still counts as synced for our purposes
  const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
  await db.doc(`users/${uid}`).set(
    { laMesaWaitlistSyncedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  logger.info('LA MESA waitlist sync ok', {
    uid,
    email: body.email,
    status: json.status,
    reason: json.reason,
  });
  return true;
}

async function syncOutbound(uid: string, data: FnUserPayload, opts?: { forcePerso?: boolean; forceLaMesa?: boolean }) {
  const needPerso = opts?.forcePerso || !data.databasePersoContacterSyncedAt;
  const needLaMesa = opts?.forceLaMesa || !data.laMesaWaitlistSyncedAt;
  if (needPerso) {
    await pushToDatabasePersoContacter(uid, data);
  }
  if (needLaMesa) {
    await pushToLaMesa(uid, data);
  }
}

/**
 * Parallel outbound sync on new FrancoNetwork profiles:
 * 1) Database Perso → liste LA MESA - CONTACTER + À CONTACTER
 * 2) LA MESA waitlist (y compris express non validés)
 */
export const syncUserToLaMesaOnCreate = onDocumentCreated(
  {
    document: 'users/{uid}',
    database: FIRESTORE_DATABASE_ID,
    region: 'us-central1',
    retry: false,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    await syncOutbound(event.params.uid, snap.data() as FnUserPayload, {
      forcePerso: true,
      forceLaMesa: true,
    });
  }
);

/**
 * Catch profiles that gained email/name, or never finished outbound sync.
 * When a profile becomes directory-visible, re-push LA MESA (validated path / INSCRITS).
 */
export const syncUserToLaMesaOnUpdate = onDocumentUpdated(
  {
    document: 'users/{uid}',
    database: FIRESTORE_DATABASE_ID,
    region: 'us-central1',
    retry: false,
  },
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;
    if (!after) return;
    const data = after.data() as FnUserPayload;
    const prev = (before?.data() ?? {}) as FnUserPayload;

    const email = asStr(data.email);
    const fullName = asStr(data.fullName);
    if (!email || !fullName) return;

    const becameVisible = prev.isValidated === false && data.isValidated !== false;
    const needPerso = !data.databasePersoContacterSyncedAt;
    const needLaMesa = !data.laMesaWaitlistSyncedAt || becameVisible;
    if (!needPerso && !needLaMesa) return;

    await syncOutbound(event.params.uid, data, {
      forcePerso: needPerso,
      forceLaMesa: needLaMesa,
    });
  }
);
