import type { Language } from './types';

type NeedLabel = { fr: string; es: string; en: string };

/** Libellés FR/ES/EN par groupe et par besoin (codes stables pour Firestore / filtres). */
export const NEED_OPTIONS: {
  label: NeedLabel;
  options: { value: string; label: NeedLabel }[];
}[] = [
  {
    label: { fr: 'Partenaires & marché', es: 'Socios y mercado', en: 'Partners & market' },
    options: [
      {
        value: 'NEED_DISTRIB',
        label: {
          fr: 'Distributeurs / revendeurs / agents',
          es: 'Distribuidores / revendedores / agentes',
          en: 'Distributors / resellers / agents',
        },
      },
      {
        value: 'NEED_PARTNERS',
        label: {
          fr: 'Partenaires commerciaux / stratégiques',
          es: 'Socios comerciales / estratégicos',
          en: 'Commercial / strategic partners',
        },
      },
      {
        value: 'NEED_SUPPLIERS',
        label: {
          fr: 'Fournisseurs / fabricants / sous-traitants',
          es: 'Proveedores / fabricantes / subcontratistas',
          en: 'Suppliers / manufacturers / subcontractors',
        },
      },
      {
        value: 'NEED_SERVICE_PROV',
        label: {
          fr: 'Prestataires de services',
          es: 'Proveedores de servicios',
          en: 'Service providers',
        },
      },
      {
        value: 'NEED_INVESTORS',
        label: {
          fr: 'Investisseurs / financement',
          es: 'Inversores / financiamiento',
          en: 'Investors / funding',
        },
      },
    ],
  },
  {
    label: { fr: 'Support & expertise', es: 'Soporte y experiencia', en: 'Support & expertise' },
    options: [
      {
        value: 'NEED_LEGAL',
        label: {
          fr: 'Support juridique / conformité',
          es: 'Apoyo legal / cumplimiento',
          en: 'Legal / compliance support',
        },
      },
      {
        value: 'NEED_HR',
        label: {
          fr: 'Support RH / recrutement / formation',
          es: 'RR.HH. / reclutamiento / formación',
          en: 'HR / recruitment / training',
        },
      },
      {
        value: 'NEED_FIN_SUPPORT',
        label: {
          fr: 'Support comptable / fiscal / financier',
          es: 'Contable / fiscal / financiero',
          en: 'Accounting / tax / finance support',
        },
      },
      {
        value: 'NEED_IT',
        label: {
          fr: 'Support IT / digital / cybersécurité',
          es: 'TI / Digital / Ciberseguridad',
          en: 'IT / digital / cybersecurity',
        },
      },
      {
        value: 'NEED_MKT',
        label: {
          fr: 'Support marketing / communication / design',
          es: 'Marketing / comunicación / diseño',
          en: 'Marketing / communications / design',
        },
      },
      {
        value: 'NEED_LOG',
        label: {
          fr: 'Support logistique / transport / entreposage',
          es: 'Logística / transporte / almacenaje',
          en: 'Logistics / transport / warehousing',
        },
      },
    ],
  },
  {
    label: { fr: 'Information & réseau', es: 'Información y red', en: 'Information & network' },
    options: [
      {
        value: 'NEED_RESEARCH',
        label: {
          fr: 'Études de marché / veille / data',
          es: 'Estudios de mercado / vigilancia / datos',
          en: 'Market research / intelligence / data',
        },
      },
      {
        value: 'NEED_MENTOR',
        label: {
          fr: 'Mentorat / conseil stratégique / board',
          es: 'Mentoría / asesoría / consejo',
          en: 'Mentoring / strategic advice / board',
        },
      },
      {
        value: 'NEED_VISIBILITY',
        label: {
          fr: 'Visibilité / média / RP',
          es: 'Visibilidad / medios / relaciones públicas',
          en: 'Visibility / media / PR',
        },
      },
      {
        value: 'NEED_ECOSYSTEM',
        label: {
          fr: 'Partenaires locaux (chambres, clusters…)',
          es: 'Aliados locales (cámaras, clústeres…)',
          en: 'Local partners (chambers, clusters…)',
        },
      },
      {
        value: 'NEED_OTHER',
        label: {
          fr: 'Autre besoin / non précisé',
          es: 'Otra necesidad / no especificado',
          en: 'Other need / unspecified',
        },
      },
    ],
  },
];

const IDS = NEED_OPTIONS.flatMap((g) => g.options.map((o) => o.value));

/** Ensemble des codes autorisés. */
export const NEED_OPTION_VALUE_SET = new Set(IDS);

/** Libellé affiché pour un code NEED_*. */
export function needOptionLabel(value: string, lang: Language): string {
  for (const g of NEED_OPTIONS) {
    const o = g.options.find((x) => x.value === value);
    if (o) return o.label[lang];
  }
  return value;
}

/**
 * Garde uniquement les ids connus, sans doublons, max 3 (ordre conservé).
 */
export function sanitizeHighlightedNeeds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of raw) {
    if (typeof x !== 'string' || out.length >= 3) break;
    if (!NEED_OPTION_VALUE_SET.has(x) || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

/** Phrase résumant les besoins mis en avant (ex. partage, prompts). */
export function formatHighlightedNeedsForText(ids: string[] | undefined, lang: Language): string {
  const list = sanitizeHighlightedNeeds(ids);
  if (list.length === 0) return '';
  const sep = lang === 'fr' ? ' ; ' : '; ';
  return list.map((id) => needOptionLabel(id, lang)).join(sep);
}
