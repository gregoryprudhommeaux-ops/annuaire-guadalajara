/** Initiales pour avatar (même logique que l’ancien bandeau nouveaux membres). */
export function profileInitialsFromName(fullName: string, companyFallback = ''): string {
  const n = (fullName || companyFallback || '').trim();
  if (!n) return '?';
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    if (a && b) return (a + b).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase() || '?';
}
