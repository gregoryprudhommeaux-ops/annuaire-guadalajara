import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { getResend, RESEND_FROM_PARAM, APP_URL_PARAM } from '../lib/resend';
import { renderTemplate } from '../lib/sendEmail';
import { resolveAudience, type AudienceMember } from '../lib/audience';
import { CampaignEmail } from '../emails/CampaignEmail';
import {
  automationMatchesLanguage,
  hasAutomationFor,
  isTriggerEnabled,
  loadEnabledAutomations,
} from '../lib/automations';
import { buildVariables, interpolate } from '../lib/templateVars';

const BATCH_SIZE = 100;
const TZ = 'America/Mexico_City';
const CONFIG_DOC = 'appConfig/monthlyStats';
const VITRINE_PRIMARY_DOC = 'public_vitrine/default';
const VITRINE_ALIAS_DOC = 'publicStats/summary';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

function dedupeByEmail(rows: AudienceMember[]): AudienceMember[] {
  const map = new Map<string, AudienceMember>();
  for (const r of rows) {
    if (!map.has(r.email)) map.set(r.email, r);
  }
  return Array.from(map.values());
}

function mexicoTodayParts(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { y: get('year'), m: get('month'), d: get('day') };
}

function lastDayOfMonth(year: number, month1to12: number): number {
  // UTC-safe: day 0 of next month is last day of current month.
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

function fmtNum(lang: 'fr' | 'es' | 'en', n: number): string {
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'es-MX';
  try {
    return Math.max(0, Math.round(n)).toLocaleString(locale);
  } catch {
    return String(Math.max(0, Math.round(n)));
  }
}

function fmtPct(pct: number): string {
  const n = Math.round(Number(pct) || 0);
  if (n > 0) return `+${n}%`;
  if (n < 0) return `${n}%`;
  return '0%';
}

async function loadVitrineKpis(db: FirebaseFirestore.Firestore): Promise<{
  totalMembers: number;
  potentialConnections: number;
  distinctSectorsCount: number;
  monthOverMonthGrowthPct: number;
}> {
  const parseNum = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);
  const trySnap = async (path: string) => {
    try {
      const snap = await db.doc(path).get();
      return snap.exists ? (snap.data() as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  const d = (await trySnap(VITRINE_PRIMARY_DOC)) ?? (await trySnap(VITRINE_ALIAS_DOC));
  if (d) {
    return {
      totalMembers: parseNum(d.totalMembers),
      potentialConnections: parseNum(d.potentialConnections),
      distinctSectorsCount: parseNum(d.distinctSectorsCount),
      monthOverMonthGrowthPct: parseNum(d.monthOverMonthGrowthPct),
    };
  }

  // Fallback simple : compter les docs users (hors admins explicites) — robuste mais approximatif.
  const users = await db.collection('users').get();
  let total = 0;
  for (const doc of users.docs) {
    const row = doc.data() as Record<string, unknown>;
    if (row.role === 'admin') continue;
    total += 1;
  }
  // Approximation des connexions (n*(n-1)/2), secteurs / croissance inconnus.
  const pot = total > 1 ? (total * (total - 1)) / 2 : 0;
  return { totalMembers: total, potentialConnections: pot, distinctSectorsCount: 0, monthOverMonthGrowthPct: 0 };
}

/**
 * Fin de mois (vitrine stats) — envoi automatique.
 *
 * Planification : tous les jours à 09:10 (heure Guadalajara), mais n'envoie que
 * le dernier jour du mois + idempotent via appConfig/monthlyStats.lastSentYm.
 *
 * Option : ajoute une liste d'emails externes via appConfig/monthlyStats.externalEmails.
 */
export const monthlyStatsDigest = onSchedule(
  {
    schedule: 'every day 09:10',
    timeZone: TZ,
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
  },
  async () => {
    const triggerOn = await isTriggerEnabled('monthlySchedule');
    if (!triggerOn) {
      logger.info('Monthly stats digest disabled via appConfig, skip.');
      return;
    }

    const { y, m, d } = mexicoTodayParts();
    const last = lastDayOfMonth(y, m);
    if (d !== last) {
      logger.info('Monthly stats digest: not last day, skip.', { y, m, d, last });
      return;
    }

    const ym = `${y}-${String(m).padStart(2, '0')}`;
    const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
    const configRef = db.doc(CONFIG_DOC);
    const configSnap = await configRef.get();
    const cfg = (configSnap.exists ? (configSnap.data() as Record<string, unknown>) : {}) ?? {};
    const lastSentYm = String(cfg.lastSentYm ?? '').trim();
    if (lastSentYm === ym) {
      logger.info('Monthly stats digest: already sent for month, skip.', { ym });
      return;
    }

    const externalEmails = Array.from(
      new Set(
        String(cfg.externalEmails ?? '')
          .split(/[\s,;]+/)
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s && isValidEmail(s))
      )
    );

    const members = await resolveAudience({ type: 'all' });
    const extras: AudienceMember[] = externalEmails.map((email) => ({
      uid: '',
      email,
      displayName: 'cher membre',
      fullName: '',
      completionRate: 0,
      communicationLanguage: 'fr',
    }));

    const audience = dedupeByEmail([...members, ...extras]);
    if (audience.length === 0) {
      logger.info('Monthly stats digest: empty audience.');
      return;
    }

    const resend = getResend();
    const from = RESEND_FROM_PARAM.value();
    const appUrl = APP_URL_PARAM.value();

    const vitrineKpis = await loadVitrineKpis(db);

    const hasFirestoreAutomations = await hasAutomationFor('monthlySchedule');
    const automations = hasFirestoreAutomations
      ? await loadEnabledAutomations('monthlySchedule')
      : [];

    if (hasFirestoreAutomations && automations.length === 0) {
      logger.info('Monthly stats digest: no enabled Firestore automations, skip.');
      return;
    }

    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < audience.length; i += BATCH_SIZE) {
      const chunk = audience.slice(i, i + BATCH_SIZE);

      const payloads = await Promise.all(
        chunk.map(async (m) => {
          // Fallback hardcodé si aucune automation en base.
          if (automations.length === 0) {
            const vars = buildVariables({
              uid: m.uid,
              email: m.email,
              displayName: m.displayName,
              fullName: m.fullName,
              companyName: m.companyName,
              completionRate: m.completionRate,
              communicationLanguage: m.communicationLanguage,
            });
            const subject = `Communauté en chiffres — ${vars.monthLabel}`;
            const bodyHtml = `<p>Bonjour ${vars.firstName},</p>
<p>Voici la vitrine <strong>« Communauté en chiffres »</strong> pour <strong>${vars.monthLabel}</strong>.</p>
<p><a href="${vars.statsShareUrl}">Voir la page à partager</a></p>
<p><a href="${vars.profileEditUrl}">Mettre à jour mon profil</a></p>`;
            const { html, text } = await renderTemplate(
              CampaignEmail({ title: subject, bodyHtml, appUrl })
            );
            return [
              {
                from,
                to: m.email,
                subject,
                html,
                text,
                tags: [{ name: 'category', value: 'monthly_stats' }],
              },
            ];
          }

          const matching = automations.filter((a) =>
            automationMatchesLanguage(a, m.communicationLanguage)
          );
          if (matching.length === 0) return [];
          const vars = buildVariables({
            uid: m.uid,
            email: m.email,
            displayName: m.displayName,
            fullName: m.fullName,
            companyName: m.companyName,
            completionRate: m.completionRate,
            communicationLanguage: m.communicationLanguage,
          });
          const varsWithKpis = {
            ...vars,
            kpiMembers: fmtNum(vars.language as 'fr' | 'es' | 'en', vitrineKpis.totalMembers),
            kpiConnections: fmtNum(vars.language as 'fr' | 'es' | 'en', vitrineKpis.potentialConnections),
            kpiSectors: fmtNum(vars.language as 'fr' | 'es' | 'en', vitrineKpis.distinctSectorsCount),
            kpiGrowthPct: fmtPct(vitrineKpis.monthOverMonthGrowthPct),
          };
          return Promise.all(
            matching.map(async (a) => {
              const subject = interpolate(a.subject, varsWithKpis);
              const bodyHtml = interpolate(a.bodyHtml, varsWithKpis);
              const { html, text } = await renderTemplate(
                CampaignEmail({ title: a.name || subject, bodyHtml, appUrl })
              );
              return {
                from,
                to: m.email,
                subject,
                html,
                text,
                tags: [
                  { name: 'category', value: 'monthly_stats' },
                  { name: 'automation', value: a.id.slice(0, 32) },
                ],
              };
            })
          );
        })
      );

      const flat = payloads.flat();

      try {
        const res = await resend.batch.send(flat);
        if (res.error) {
          failed += flat.length;
          logger.error('Resend batch error (monthly)', { i, err: res.error });
        } else {
          succeeded += flat.length;
        }
      } catch (err) {
        failed += flat.length;
        logger.error('Resend batch exception (monthly)', { i, err });
      }
    }

    await configRef.set(
      { lastSentYm: ym, lastSentAt: new Date().toISOString() },
      { merge: true }
    );

    logger.info('Monthly stats digest done', {
      ym,
      recipients: audience.length,
      automations: automations.length,
      externalEmails: externalEmails.length,
      succeeded,
      failed,
    });
  }
);

