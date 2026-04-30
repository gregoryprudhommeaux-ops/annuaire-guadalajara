import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FIRESTORE_DATABASE_ID } from '../constants';

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Endpoint public : renvoie une page HTML rendue depuis `publicEmailTemplates/{id}`.
 * Pas d’auth : la doc “publique” est assumée partageable.
 */
export const publicTemplateHtml = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    try {
      const templateId = String(req.query.id ?? '').trim();
      if (!templateId) {
        res.status(400).type('text/plain').send('Missing id');
        return;
      }

      const app = getApps()[0];
      if (!app) {
        res.status(500).type('text/plain').send('Admin app not initialized');
        return;
      }

      const db = getFirestore(app, FIRESTORE_DATABASE_ID);
      const snap = await db.doc(`publicEmailTemplates/${templateId}`).get();
      if (!snap.exists) {
        res.status(404).type('text/plain').send('Not found');
        return;
      }
      const data = snap.data() as { name?: string; subject?: string; bodyHtml?: string } | undefined;
      const name = String(data?.name ?? '').trim();
      const subject = String(data?.subject ?? '').trim();
      const bodyHtml = String(data?.bodyHtml ?? '').trim();

      const title = escapeHtml(name || subject || 'Template');
      const subjectLine = subject ? `<p style="margin:6px 0 0;color:#57534e;font-weight:600">${escapeHtml(subject)}</p>` : '';

      const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <meta name="robots" content="noindex" />
</head>
<body style="margin:0;background:#ffffff;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:760px;margin:0 auto;padding:20px 16px;">
    <div style="border-bottom:1px solid #e7e5e4;padding-bottom:12px;margin-bottom:16px;">
      <h1 style="margin:0;font-size:18px;line-height:1.2;font-weight:800;color:#1c1917">${title}</h1>
      ${subjectLine}
    </div>
    ${bodyHtml}
  </div>
</body>
</html>`;

      res.setHeader('Cache-Control', 'no-store');
      res.status(200).type('text/html; charset=utf-8').send(html);
    } catch (err) {
      logger.error('publicTemplateHtml failed', {
        err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      });
      res.status(500).type('text/plain').send('Internal error');
    }
  }
);

