import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { VIEWER_LINKS, VIEWER_SESSIONS, getDb, hashToken, nowTs } from '../lib/viewerMagicLinks';

function json(res: any, code: number, payload: unknown) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(code).send(JSON.stringify(payload));
}

export const viewerMagicLinkEnd = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    try {
      const token = String(req.query.token ?? '').trim();
      const sessionId = String(req.query.sessionId ?? '').trim();
      if (!token || !sessionId) {
        json(res, 400, { ok: false, status: 'error', message: 'Missing token/sessionId' });
        return;
      }
      const tokenHash = hashToken(token);
      const db = getDb();
      const sref = db.collection(VIEWER_SESSIONS).doc(sessionId);
      const ssnap = await sref.get();
      if (!ssnap.exists) {
        json(res, 404, { ok: false, status: 'not_found' });
        return;
      }
      const s = ssnap.data() as any;
      if (String(s.tokenHash ?? '') !== tokenHash) {
        json(res, 403, { ok: false, status: 'revoked' });
        return;
      }
      const endedAtExisting = s.endedAt as Timestamp | null | undefined;
      const startedAt = s.startedAt as Timestamp | undefined;
      if (!startedAt) {
        json(res, 400, { ok: false, status: 'error' });
        return;
      }
      if (endedAtExisting) {
        json(res, 200, { ok: true, alreadyEnded: true });
        return;
      }

      const endedAt = nowTs();
      const durationSec = Math.max(0, Math.round((endedAt.toMillis() - startedAt.toMillis()) / 1000));
      await sref.set(
        {
          endedAt,
          lastSeenAt: endedAt,
          durationSec,
        },
        { merge: true }
      );

      const linkId = String(s.linkId ?? '').trim();
      if (linkId) {
        await db.collection(VIEWER_LINKS).doc(linkId).set(
          {
            totalDurationSec: FieldValue.increment(durationSec),
          },
          { merge: true }
        );
      }

      json(res, 200, { ok: true, durationSec });
    } catch (err) {
      logger.error('viewerMagicLinkEnd failed', {
        err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      });
      json(res, 500, { ok: false, status: 'error' });
    }
  }
);

