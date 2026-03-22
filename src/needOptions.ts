import type { Language } from './types';

/** Libellés FR/ES par groupe et par besoin (codes stables pour Firestore / filtres). */
export const NEED_OPTIONS: {
  label: { fr: string; es: string };
  options: { value: string; label: { fr: string; es: string } }[];
}[] = [
  {
    label: { fr: 'Partenaires & marché', es: 'Socios y mercado' },
    options: [
      { value: 'NEED_CLIENTS', label: { fr: 'Nouveaux clients / comptes finaux', es: 'Nuevos clientes / cuentas finales' } },
      { value: 'NEED_DISTRIB', label: { fr: 'Distributeurs / revendeurs / agents', es: 'Distribuidores / revendedores / agentes' } },
      { value: 'NEED_PARTNERS', label: { fr: 'Partenaires commerciaux / stratégiques', es: 'Socios comerciales / estratégicos' } },
      { value: 'NEED_SUPPLIERS', label: { fr: 'Fournisseurs / fabricants / sous-traitants', es: 'Proveedores / fabricantes / subcontratistas' } },
      { value: 'NEED_SERVICE_PROV', label: { fr: 'Prestataires de services', es: 'Proveedores de servicios' } },
      { value: 'NEED_INVESTORS', label: { fr: 'Investisseurs / financement', es: 'Inversores / financiamiento' } },
    ],
  },
  {
    label: { fr: 'Support & expertise', es: 'Soporte y experiencia' },
    options: [
      { value: 'NEED_LEGAL', label: { fr: 'Support juridique / conformité', es: 'Apoyo legal / cumplimiento' } },
      { value: 'NEED_HR', label: { fr: 'Support RH / recrutement / formation', es: 'RR.HH. / reclutamiento / formación' } },
      { value: 'NEED_FIN_SUPPORT', label: { fr: 'Support comptable / fiscal / financier', es: 'Contable / fiscal / financiero' } },
      { value: 'NEED_IT', label: { fr: 'Support IT / digital / cybersécurité', es: 'TI / Digital / Ciberseguridad' } },
      { value: 'NEED_MKT', label: { fr: 'Support marketing / communication / design', es: 'Marketing / comunicación / diseño' } },
      { value: 'NEED_LOG', label: { fr: 'Support logistique / transport / entreposage', es: 'Logística / transporte / almacenaje' } },
    ],
  },
  {
    label: { fr: 'Information & réseau', es: 'Información y red' },
    options: [
      { value: 'NEED_RESEARCH', label: { fr: 'Études de marché / veille / data', es: 'Estudios de mercado / vigilancia / datos' } },
      { value: 'NEED_MENTOR', label: { fr: 'Mentorat / conseil stratégique / board', es: 'Mentoría / asesoría / consejo' } },
      { value: 'NEED_VISIBILITY', label: { fr: 'Visibilité / média / RP', es: 'Visibilidad / medios / relaciones públicas' } },
      { value: 'NEED_ECOSYSTEM', label: { fr: 'Partenaires locaux (chambres, clusters…)', es: 'Aliados locales (cámaras, clústeres…)' } },
      { value: 'NEED_OTHER', label: { fr: 'Autre besoin / non précisé', es: 'Otra necesidad / no especificado' } },
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
  return list.map((id) => needOptionLabel(id, lang)).join(lang === 'fr' ? ' ; ' : '; ');
}
