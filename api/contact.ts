export const config = { runtime: 'edge' };

const MAX_MESSAGE = 8000;
const MAX_NAME = 200;

const corsJsonHeaders: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsJsonHeaders,
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, code: 'method_not_allowed' }, 405);
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim();
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    'Annuaire Guadalajara <onboarding@resend.dev>';

  if (!apiKey || !to) {
    return json({ ok: false, code: 'not_configured' }, 503);
  }

  let payload: {
    name?: string;
    email?: string;
    message?: string;
    website?: string;
  };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json({ ok: false, code: 'invalid_json' }, 400);
  }

  if (payload.website && String(payload.website).trim() !== '') {
    return json({ ok: true }, 200);
  }

  const name = String(payload.name ?? '').trim().slice(0, MAX_NAME);
  const email = String(payload.email ?? '').trim().slice(0, 320);
  const message = String(payload.message ?? '').trim().slice(0, MAX_MESSAGE);

  if (!name || !email || !message) {
    return json({ ok: false, code: 'validation' }, 400);
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return json({ ok: false, code: 'validation' }, 400);
  }

  const text = [
    `Nom / Name: ${name}`,
    `E-mail: ${email}`,
    '',
    message,
    '',
    `— Envoyé depuis le formulaire Contact (annuaire).`,
  ].join('\n');

  const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`;

  const subject = `[Annuaire] Contact - ${name}`.slice(0, 998);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('Resend error', res.status, errText);
    let detail = '';
    try {
      const parsed = JSON.parse(errText) as { message?: string | string[] };
      const msg = parsed.message;
      if (typeof msg === 'string') {
        detail = msg.slice(0, 280);
      } else if (Array.isArray(msg) && msg.length > 0) {
        detail = String(msg[0]).slice(0, 280);
      }
    } catch {
      /* ignore */
    }
    return json({ ok: false, code: 'send_failed', detail }, 502);
  }

  return json({ ok: true }, 200);
}
