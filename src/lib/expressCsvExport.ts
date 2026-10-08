import type { PeriodKey } from '@/hooks/useAdminStats';
import type { ExpressMemberRow } from '@/lib/expressDashboardCompute';

const APP_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://franconetwork.app';

export function getExpressPeriodStart(period: PeriodKey): Date | null {
  const now = new Date();
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (period === '90d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    return d;
  }
  return null;
}

export function filterExpressRowsByPeriod(
  rows: ExpressMemberRow[],
  period: PeriodKey
): ExpressMemberRow[] {
  const start = getExpressPeriodStart(period);
  if (!start) return rows;
  return rows.filter((r) => {
    const d = r.createdAt?.toDate?.();
    return d ? d >= start : false;
  });
}

function csvEscape(value: string): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatCreatedAt(row: ExpressMemberRow): string {
  const d = row.createdAt?.toDate?.();
  if (!d) return '';
  // ISO local-friendly for Sheets: YYYY-MM-DD HH:mm
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function validationLabel(row: ExpressMemberRow): string {
  if (row.isValidated === true) return 'validated';
  if (row.isValidated === false || row.needsAdminReview) return 'pending';
  return '';
}

/** Headers + rows — UTF-8 CSV ready for Google Sheets (File → Import → Upload). */
export function buildExpressCsv(rows: ExpressMemberRow[]): string {
  const headers = [
    'created_at',
    'full_name',
    'email',
    'whatsapp',
    'nationality',
    'city',
    'company_name',
    'mexico_since',
    'looking_for',
    'community_gap',
    'language',
    'validation_status',
    'uid',
    'profile_url',
  ];

  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        formatCreatedAt(r),
        r.fullName,
        r.email,
        r.whatsapp,
        r.nationality,
        r.city,
        r.companyName === 'N/A' ? '' : r.companyName,
        r.mexicoArrivalNote,
        r.lookingFor,
        r.communityGap,
        r.communicationLanguage,
        validationLabel(r),
        r.id,
        `${APP_ORIGIN}/profil/${encodeURIComponent(r.id)}`,
      ]
        .map(csvEscape)
        .join(',')
    );
  }

  // BOM so Sheets / Excel detect UTF-8 (accents FR/ES).
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function downloadExpressCsv(rows: ExpressMemberRow[], period: PeriodKey): void {
  const csv = buildExpressCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `franconetwork-express-${period}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
