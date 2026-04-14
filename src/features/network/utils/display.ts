export function clampText(text: string | undefined, maxLength = 220): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}…`;
}

export function getInitials(fullName: string | undefined): string {
  if (!fullName) return 'M';
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function normalizeCompanyName(name: string | undefined): string {
  if (!name) return '';
  return name.trim();
}

export function normalizeSectorName(sector: string | undefined): string {
  if (!sector) return '';
  return sector.trim();
}

export function getVisibleNeeds(needs: string[] | undefined, max = 3): string[] {
  if (!needs?.length) return [];
  return needs.slice(0, max);
}
