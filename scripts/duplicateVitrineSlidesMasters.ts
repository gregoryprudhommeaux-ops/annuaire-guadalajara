import fs from 'node:fs';
import path from 'node:path';
import { google } from 'googleapis';

type Lang = 'fr' | 'en' | 'es';

type TemplateJson = {
  template_id: string;
  template_id_by_lang?: Partial<Record<Lang, string>>;
  language?: string;
  brand?: { name?: string };
};

function loadTemplateJson(): { filePath: string; json: TemplateJson } {
  const filePath = path.resolve(__dirname, '../config/vitrine-template.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return { filePath, json: JSON.parse(raw) as TemplateJson };
}

function saveTemplateJson(filePath: string, json: TemplateJson) {
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v.trim();
}

function getOAuthClient() {
  const clientId = requireEnv('GOOGLE_OAUTH_CLIENT_ID');
  const clientSecret = requireEnv('GOOGLE_OAUTH_CLIENT_SECRET');
  const refreshToken = requireEnv('GOOGLE_OAUTH_REFRESH_TOKEN');
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

async function copyPresentation(
  drive: ReturnType<typeof google.drive>,
  sourcePresentationId: string,
  name: string
): Promise<string> {
  const res = await drive.files.copy({
    fileId: sourcePresentationId,
    requestBody: { name },
    fields: 'id',
  });
  const id = res.data.id;
  if (!id) throw new Error('Drive copy: id missing');
  return id;
}

function assertRealPresentationId(id: string) {
  // Google file IDs are typically 25+ chars, url-safe base64-ish.
  // This prevents trying to copy placeholder slugs.
  if (id.length < 20 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(
      `template_id doesn't look like a real Google Slides file ID: "${id}".\n` +
        `Please set config/vitrine-template.json.template_id to the real ID from:\n` +
        `https://docs.google.com/presentation/d/<ID>/edit`
    );
  }
}

async function main() {
  const { filePath, json } = loadTemplateJson();
  const baseId = String(json.template_id ?? '').trim();
  assertRealPresentationId(baseId);

  const brand = json.brand?.name?.trim() || 'FrancoNetwork';

  const auth = getOAuthClient();
  const drive = google.drive({ version: 'v3', auth });

  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);
  const masters: Record<Lang, string> = {
    fr: await copyPresentation(drive, baseId, `${brand} — Vitrine — Master (FR) — ${stamp}`),
    en: await copyPresentation(drive, baseId, `${brand} — Vitrine — Master (EN) — ${stamp}`),
    es: await copyPresentation(drive, baseId, `${brand} — Vitrine — Master (ES) — ${stamp}`),
  };

  json.template_id_by_lang = { ...(json.template_id_by_lang ?? {}), ...masters };
  json.language = 'multi';
  saveTemplateJson(filePath, json);

  // eslint-disable-next-line no-console
  console.log('✅ Masters created:');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(masters, null, 2));
  // eslint-disable-next-line no-console
  console.log('\nUpdated config/vitrine-template.json.template_id_by_lang');
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});

