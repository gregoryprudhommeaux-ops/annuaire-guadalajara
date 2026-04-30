import type { Language } from '@/types';
import { getStatsVitrineCopy } from '@/i18n/statsVitrine';

/**
 * Sous-lignes d’interprétation par clé de catégorie (clé = `NeedChartRow.key` / agrégat needs).
 */
export function getOpportunitySubline(categoryKey: string, lang: Language): string {
  const { opportunitySub, opportunitySubGeneric } = getStatsVitrineCopy(lang);
  return opportunitySub[categoryKey] ?? opportunitySubGeneric;
}
