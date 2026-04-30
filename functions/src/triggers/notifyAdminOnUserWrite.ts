import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { defineString } from 'firebase-functions/params';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { APP_URL_PARAM, getResend, RESEND_FROM_PARAM } from '../lib/resend';
import { renderTemplate } from '../lib/sendEmail';
import { CampaignEmail } from '../emails/CampaignEmail';

const ADMIN_NOTIFY_EMAIL = defineString('ADMIN_NOTIFY_EMAIL', {
  default: 'gregory.prudhommeaux@gmail.com',
});

const IGNORED_KEYS = new Set<string>([
  'updatedAt',
  'createdAt',
  'lastSeen',
  'welcomeEmailSentAt',
  'stats',
  'profileViewCount',
  'publicProfileViewCount',
  'contactClickCount',
  'publicContactClickCount',
]);

// Champs "métier" surveillés (si un champ non listé change, on le remonte quand même,
// mais cet ordre donne un rendu plus lisible).
const KEY_ORDER: string[] = [
  'fullName',
  'displayName',
  'companyName',
  'email',
  'whatsapp',
  'phone',
  'city',
  'activityCategory',
  'positionCategory',
  'companySize',
  'memberBio',
  'activityDescription',
  'highlightedNeeds',
  'passionIds',
  'workingLanguages',
  'communicationLanguage',
  'photoURL',
];

function safeStr(v: unknown, max = 220): string {
  const s =
    typeof v === 'string'
      ? v.trim()
      : Array.isArray(v)
        ? v.filter(Boolean).join(', ')
        : v && typeof v === 'object'
          ? JSON.stringify(v)
          : String(v ?? '');
  const out = s.replace(/\s+/g, ' ').trim();
  if (!out) return '—';
  return out.length > max ? `${out.slice(0, max - 1)}…` : out;
}

function displayNameFromDoc(docId: string, d: Record<string, unknown>): string {
  return (
    String(d.fullName ?? '').trim() ||
    String(d.companyName ?? '').trim() ||
    String(d.email ?? '').trim() ||
    docId
  );
}

function profileLink(uid: string): string {
  const base = APP_URL_PARAM.value() || 'https://franconetwork.app';
  return `${base.replace(/\/+$/, '')}/profil/${encodeURIComponent(uid)}`;
}

function diffUserDoc(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Array<{ key: string; before: string; after: string }> {
  const keys = new Set<string>([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  // Ignorer champs techniques
  IGNORED_KEYS.forEach((k) => keys.delete(k));

  const out: Array<{ key: string; before: string; after: string }> = [];
  keys.forEach((key) => {
    const b = (before as any)?.[key];
    const a = (after as any)?.[key];
    // normalisation simple pour comparaison
    const bs = safeStr(b);
    const as = safeStr(a);
    if (bs === as) return;
    out.push({ key, before: bs, after: as });
  });

  const rank = new Map<string, number>();
  KEY_ORDER.forEach((k, i) => rank.set(k, i));
  out.sort((x, y) => (rank.get(x.key) ?? 999) - (rank.get(y.key) ?? 999) || x.key.localeCompare(y.key));
  return out.slice(0, 18);
}

async function sendAdminEmail(args: {
  subject: string;
  title: string;
  bodyHtml: string;
  tags: { name: string; value: string }[];
}) {
  const resend = getResend();
  const from = RESEND_FROM_PARAM.value();
  const to = ADMIN_NOTIFY_EMAIL.value();
  const appUrl = APP_URL_PARAM.value();
  const { html, text } = await renderTemplate(
    CampaignEmail({ title: args.title, bodyHtml: args.bodyHtml, appUrl })
  );
  const res = await resend.emails.send({
    from,
    to,
    subject: args.subject,
    html,
    text,
    tags: args.tags,
  });
  if (res.error) {
    throw new Error(res.error.message ?? 'Resend error');
  }
}

export const notifyAdminOnUserCreated = onDocumentCreated(
  {
    document: 'users/{uid}',
    database: FIRESTORE_DATABASE_ID,
    region: 'us-central1',
    retry: false,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const uid = event.params.uid as string;
    const d = snap.data() as Record<string, unknown>;

    const name = displayNameFromDoc(uid, d);
    const link = profileLink(uid);
    const subject = `Nouveau compte — ${name}`;

    const bodyHtml = `<p><strong>Nouveau compte créé</strong></p>
<p><strong>${safeStr(name)}</strong></p>
<p><a href="${link}">Voir le profil sur la plateforme →</a></p>
<hr/>
<p style="font-size:12px;color:#6b7280">
Email: ${safeStr(d.email)}<br/>
Société: ${safeStr(d.companyName)}<br/>
Secteur: ${safeStr(d.activityCategory)}<br/>
WhatsApp: ${safeStr((d as any).whatsapp ?? (d as any).phone)}
</p>`;

    try {
      await sendAdminEmail({
        subject,
        title: 'Nouveau compte',
        bodyHtml,
        tags: [
          { name: 'category', value: 'admin_notify' },
          { name: 'event', value: 'user_created' },
        ],
      });
      logger.info('Admin notified (user created)', { uid });
    } catch (err) {
      logger.error('Admin notify failed (user created)', { uid, err });
    }
  }
);

export const notifyAdminOnUserUpdated = onDocumentUpdated(
  {
    document: 'users/{uid}',
    database: FIRESTORE_DATABASE_ID,
    region: 'us-central1',
    retry: false,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const before = event.data?.before?.data() as Record<string, unknown> | undefined;
    const after = event.data?.after?.data() as Record<string, unknown> | undefined;
    if (!before || !after) return;

    const changes = diffUserDoc(before, after);
    if (changes.length === 0) return; // éviter le bruit (lastSeen/updatedAt etc.)

    const name = displayNameFromDoc(uid, after);
    const link = profileLink(uid);
    const subject = `Profil modifié — ${name}`;

    const changesHtml = changes
      .map(
        (c) =>
          `<tr>
  <td style="padding:6px 8px;border:1px solid #e5e7eb;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;font-size:12px;color:#0f172a;">${safeStr(
    c.key,
    80
  )}</td>
  <td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:12px;color:#334155;">${safeStr(
    c.before
  )}</td>
  <td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:12px;color:#334155;">${safeStr(
    c.after
  )}</td>
</tr>`
      )
      .join('');

    const bodyHtml = `<p><strong>Profil modifié</strong></p>
<p><strong>${safeStr(name)}</strong></p>
<p><a href="${link}">Voir le profil sur la plateforme →</a></p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-top:12px;">
  <thead>
    <tr>
      <th align="left" style="padding:6px 8px;border:1px solid #e5e7eb;background:#f8fafc;font-size:12px;">Champ</th>
      <th align="left" style="padding:6px 8px;border:1px solid #e5e7eb;background:#f8fafc;font-size:12px;">Avant</th>
      <th align="left" style="padding:6px 8px;border:1px solid #e5e7eb;background:#f8fafc;font-size:12px;">Après</th>
    </tr>
  </thead>
  <tbody>
    ${changesHtml}
  </tbody>
</table>`;

    try {
      await sendAdminEmail({
        subject,
        title: 'Profil modifié',
        bodyHtml,
        tags: [
          { name: 'category', value: 'admin_notify' },
          { name: 'event', value: 'user_updated' },
        ],
      });
      logger.info('Admin notified (user updated)', { uid, changes: changes.length });
    } catch (err) {
      logger.error('Admin notify failed (user updated)', { uid, err });
    }
  }
);

