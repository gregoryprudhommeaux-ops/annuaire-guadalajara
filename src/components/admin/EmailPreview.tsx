import React, { useMemo } from 'react';

export type EmailPreviewProps = {
  subject: string;
  bodyHtml: string;
  /** URL affichée dans le footer (lien public). */
  appUrl?: string;
};

/**
 * Aperçu HTML du corps d'email composé par l'admin, rendu dans une `<iframe srcdoc>`
 * pour isoler les styles. La coque visuelle (header / footer) imite celle générée
 * côté Cloud Function via `EmailLayout` + `@react-email/render` afin d'éviter
 * une grosse dépendance React Email côté front.
 *
 * Note : c'est une approximation visuelle. Le rendu final passe par
 * `@react-email/render` qui inline le CSS Tailwind. Petites différences possibles
 * sur la typographie selon le client mail du destinataire.
 */
export function EmailPreview({
  subject,
  bodyHtml,
  appUrl = 'https://franconetwork.app',
}: EmailPreviewProps) {
  const srcDoc = useMemo(
    () => buildPreviewHtml({ subject, bodyHtml, appUrl }),
    [subject, bodyHtml, appUrl]
  );

  return (
    <iframe
      title="Aperçu email"
      srcDoc={srcDoc}
      className="block h-[640px] w-full rounded-xl border border-stone-200 bg-stone-50"
      sandbox="allow-same-origin"
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripScripts(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '');
}

function buildPreviewHtml({
  subject,
  bodyHtml,
  appUrl,
}: {
  subject: string;
  bodyHtml: string;
  appUrl: string;
}): string {
  const safeBody = stripScripts(bodyHtml || '');
  const cleanSubject = escapeHtml(subject || 'Sans sujet');
  const host = appUrl.replace(/^https?:\/\//, '');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${cleanSubject}</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0;
    padding: 24px 16px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    background: #fafaf9;
    color: #1c1917;
    line-height: 1.55;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    padding: 32px;
  }
  .kicker {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #01696f;
    margin: 0 0 12px;
  }
  h1.subject {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 16px;
    color: #0c0a09;
  }
  .body { color: #44403c; font-size: 15px; }
  .body p { margin: 0 0 14px; }
  .body a { color: #01696f; }
  .body img { max-width: 100%; height: auto; }
  .body ul, .body ol { padding-left: 1.25rem; }
  .body blockquote {
    margin: 0 0 14px;
    padding: 8px 14px;
    border-left: 3px solid #01696f;
    background: #f5f5f4;
    color: #44403c;
  }
  .body code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    background: #f5f5f4;
    padding: 1px 6px;
    border-radius: 4px;
  }
  hr {
    border: none;
    border-top: 1px solid #e7e5e4;
    margin: 24px 0 16px;
  }
  .footer {
    font-size: 12px;
    color: #78716c;
    margin: 0;
  }
  .footer a { color: #01696f; text-decoration: none; }
  .placeholder {
    color: #a8a29e;
    font-style: italic;
  }
</style>
</head>
<body>
  <div class="container">
    <p class="kicker">FrancoNetwork · Guadalajara</p>
    <h1 class="subject">${cleanSubject}</h1>
    <div class="body">${safeBody.trim() ? safeBody : '<p class="placeholder">Le corps de l’email apparaîtra ici…</p>'}</div>
    <hr />
    <p class="footer">
      Vous recevez ce message en tant que membre du réseau d&rsquo;affaires
      francophone de Guadalajara. ·
      <a href="${escapeHtml(appUrl)}">${escapeHtml(host)}</a>
    </p>
  </div>
</body>
</html>`;
}

export default EmailPreview;
