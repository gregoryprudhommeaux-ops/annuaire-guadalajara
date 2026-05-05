import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  VIEWER_LINKS,
  VIEWER_SESSIONS,
  getDb,
  hashToken,
  nowTs,
  randomId,
} from '../lib/viewerMagicLinks';

function json(res: any, code: number, payload: unknown) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(code).send(JSON.stringify(payload));
}

export const viewerMagicLinkResolve = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (req, res) => {
    try {
      const token = String(req.query.token ?? '').trim();
      if (!token) {
        json(res, 400, { ok: false, status: 'not_found', message: 'Missing token' });
        return;
      }
      const tokenHash = hashToken(token);
      const db = getDb();
      const snap = await db
        .collection(VIEWER_LINKS)
        .where('tokenHash', '==', tokenHash)
        .limit(1)
        .get();
      if (snap.empty) {
        json(res, 404, { ok: false, status: 'not_found' });
        return;
      }
      const doc = snap.docs[0]!;
      const linkId = doc.id;
      const data = doc.data() as any;
      const expiresAt = data?.expiresAt as Timestamp | undefined;
      const revokedAt = data?.revokedAt as Timestamp | null | undefined;
      if (!expiresAt) {
        json(res, 403, { ok: false, status: 'expired' });
        return;
      }
      const expired = expiresAt.toMillis() <= Date.now();
      if (revokedAt) {
        json(res, 403, { ok: false, status: 'revoked' });
        return;
      }
      if (expired) {
        json(res, 403, { ok: false, status: 'expired' });
        return;
      }

      const sessionId = randomId(16);
      const ua = String(req.get('user-agent') ?? '').slice(0, 500);
      const startedAt = nowTs();
      await db.collection(VIEWER_SESSIONS).doc(sessionId).set({
        linkId,
        tokenHash,
        startedAt,
        lastSeenAt: startedAt,
        endedAt: null,
        durationSec: null,
        userAgent: ua,
      });

      await db.collection(VIEWER_LINKS).doc(linkId).set(
        {
          resolvesCount: FieldValue.increment(1),
          sessionsCount: FieldValue.increment(1),
          lastResolvedAt: startedAt,
          lastSessionAt: startedAt,
        },
        { merge: true }
      );

      json(res, 200, {
        ok: true,
        linkId,
        sessionId,
        expiresAtMs: expiresAt.toMillis(),
      });
    } catch (err) {
      logger.error('viewerMagicLinkResolve failed', {
        err: err instanceof Error ? { message: err.message, stack: err.stack } : String(err),
      });
      json(res, 500, { ok: false, status: 'error' });
    }
  }
);

