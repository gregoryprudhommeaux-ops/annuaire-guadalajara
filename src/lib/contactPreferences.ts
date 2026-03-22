import type { Language } from '../types';
import { pickLang } from './uiLocale';

export const WORKING_LANGUAGE_OPTIONS = [
  { code: 'FR' as const, label: { fr: 'Français', es: 'Francés', en: 'French' } },
  { code: 'ES' as const, label: { fr: 'Espagnol', es: 'Español', en: 'Spanish' } },
  { code: 'EN' as const, label: { fr: 'Anglais', es: 'Inglés', en: 'English' } },
  { code: 'PT' as const, label: { fr: 'Portugais', es: 'Portugués', en: 'Portuguese' } },
  { code: 'DE' as const, label: { fr: 'Allemand', es: 'Alemán', en: 'German' } },
  { code: 'IT' as const, label: { fr: 'Italien', es: 'Italiano', en: 'Italian' } },
  { code: 'ZH' as const, label: { fr: 'Chinois', es: 'Chino', en: 'Chinese' } },
];

const CODE_SET = new Set<string>(WORKING_LANGUAGE_OPTIONS.map((o) => o.code));

export const TYPICAL_CLIENT_SIZE_VALUES = ['independant', 'pme', 'corporate', 'mixte'] as const;
export type TypicalClientSize = (typeof TYPICAL_CLIENT_SIZE_VALUES)[number];

export function sanitizeWorkingLanguageCodes(raw: string[] | undefined | null): string[] {
  if (!raw?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== 'string' || out.length >= 3) break;
    if (!CODE_SET.has(x) || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

export function workingLanguageLabel(code: string, lang: Language): string {
  const o = WORKING_LANGUAGE_OPTIONS.find((x) => x.code === code);
  if (!o) return code;
  return o.label[lang] ?? o.label.fr;
}

export function typicalClientSizeLabel(v: TypicalClientSize, lang: Language): string {
  switch (v) {
    case 'independant':
      return pickLang(
        'Indépendant / micro-entreprise',
        'Independiente / microempresa',
        'Independent / micro-business',
        lang
      );
    case 'pme':
      return pickLang('PME / SME', 'PYME / SME', 'SME', lang);
    case 'corporate':
      return pickLang('Corporate / grands comptes', 'Corporativo / grandes cuentas', 'Corporate / enterprise', lang);
    case 'mixte':
      return pickLang('Mixte (indépendant au corporate)', 'Mixto (independiente a corporativo)', 'Mixed (independent to corporate)', lang);
    default:
      return v;
  }
}
