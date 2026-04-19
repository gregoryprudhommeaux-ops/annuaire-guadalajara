/**
 * 1) appendNewUserToGoogleSheet — à chaque nouveau compte Firebase Auth, une ligne est ajoutée.
 * 2) backfillMembersToGoogleSheet — import ponctuel de tous les profils `users` (HTTP POST sécurisé).
 *
 * Prérequis : plan Blaze, API Google Sheets activée, classeur partagé avec le compte de service
 * des Cloud Functions, paramètres dans functions/.env (voir sheet-config.example.env).
 */
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions/v1';
import { defineString } from 'firebase-functions/params';
import { google } from 'googleapis';
import { FIRESTORE_DATABASE_ID, MEMBER_SHEET_HEADERS } from './constants';

if (!getApps().length) {
  initializeApp();
}

const sheetId = defineString('GOOGLE_SHEET_ID');
const sheetTab = defineString('GOOGLE_SHEET_TAB', { default: 'Inscrits' });
const backfillSecret = defineString('BACKFILL_HTTP_SECRET');

function formatFirestoreDate(v: unknown): string {
  if (v instanceof Timestamp) {
    return v.toDate().toISOString();
  }
  if (
    v &&
    typeof v === 'object' &&
    'toDate' in v &&
    typeof (v as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  return '';
}

function getSheets() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

/** Même grille 6 colonnes pour les nouveaux comptes Auth et pour l’export Firestore. */
export const appendNewUserToGoogleSheet = functions
  .region('us-central1')
  .auth.user()
  .onCreate(async (user) => {
    const id = sheetId.value();
    if (!id) {
      functions.logger.error('Paramètre GOOGLE_SHEET_ID manquant');
      return;
    }

    const tab = sheetTab.value();
    const provider = user.providerData[0]?.providerId ?? 'password';
    const row = [
      new Date().toISOString(),
      user.uid,
      user.email ?? '',
      user.displayName ?? '',
      '',
      `inscription Auth · ${provider}${user.emailVerified ? ' · email vérifié' : ''}`,
    ];

    const sheets = getSheets();

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: id,
        range: `${tab}!A:F`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
      functions.logger.info('Ligne ajoutée au Google Sheet', { uid: user.uid });
    } catch (err) {
      functions.logger.error('Échec append Google Sheet', { uid: user.uid, err });
      throw err;
    }
  });

const ROWS_PER_UPDATE = 400;

/**
 * POST uniquement. Header : `x-backfill-secret: <BACKFILL_HTTP_SECRET>`
 * Remplit l’onglet avec l’en-tête + une ligne par document `users` (base Firestore nommée du projet).
 * Efface d’abord les colonnes A–Z de l’onglet (synchronisation complète).
 */
export const backfillMembersToGoogleSheet = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).send('Utiliser POST avec le header x-backfill-secret.');
      return;
    }

    const expected = backfillSecret.value();
    if (!expected || req.get('x-backfill-secret') !== expected) {
      res.status(403).send('Forbidden');
      return;
    }

    const id = sheetId.value();
    if (!id) {
      res.status(500).send('GOOGLE_SHEET_ID manquant');
      return;
    }
    const tab = sheetTab.value();
    const sheets = getSheets();

    const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
    const snap = await db.collection('users').get();

    const dataRows: string[][] = [];
    snap.forEach((doc) => {
      const d = doc.data();
      dataRows.push([
        formatFirestoreDate(d.createdAt),
        String(d.uid ?? doc.id),
        String(d.email ?? ''),
        String(d.fullName ?? ''),
        String(d.companyName ?? ''),
        String(d.role ?? ''),
      ]);
    });

    dataRows.sort((a, b) => a[1].localeCompare(b[1]));

    const allRows: string[][] = [Array.from(MEMBER_SHEET_HEADERS), ...dataRows];

    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: id,
        range: `${tab}!A:Z`,
      });

      for (let i = 0; i < allRows.length; i += ROWS_PER_UPDATE) {
        const chunk = allRows.slice(i, i + ROWS_PER_UPDATE);
        const rowNum = i + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId: id,
          range: `${tab}!A${rowNum}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: chunk },
        });
      }

      functions.logger.info('Backfill Google Sheet terminé', { rows: dataRows.length });
      res.status(200).json({
        ok: true,
        members: dataRows.length,
        tab,
      });
    } catch (err) {
      functions.logger.error('Backfill Google Sheet échoué', { err });
      res.status(500).json({ ok: false, error: String(err) });
    }
  });
