export function formatT(
  t: (key: string) => string,
  key: string,
  params: Record<string, string | number>
): string {
  let s = t(key);
  for (const [k, v] of Object.entries(params)) {
    const value = String(v);
    s = s.replaceAll(`{${k}}`, value).replaceAll(`{{${k}}}`, value);
  }
  return s;
}

