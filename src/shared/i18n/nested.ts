/**
 * Lecture d’une valeur string sur un chemin « a.b.c » et interpolation simple `{name}` / `{{name}}`.
 */

export function getNestedString(root: unknown, path: string): string | undefined {
  const parts = path.split('.').filter(Boolean);
  let cur: unknown = root;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  let s = template;
  for (const [k, v] of Object.entries(params)) {
    const value = String(v);
    s = s.replaceAll(`{${k}}`, value).replaceAll(`{{${k}}}`, value);
  }
  return s;
}
