import type { Language } from '../types';

/**
 * Textes de l’écran « Explorer les profils » (radar, Venn, futur tableau).
 * Aligné sur le schéma i18n du projet (`Language` = fr | en | es).
 */
export const explorerProfilsTranslations: Record<
  Language,
  Record<string, string>
> = {
  fr: {
    title: 'Explorer les profils',
    subtitle:
      'Visualisez les points communs de la communauté et trouvez des matchs pertinents.',
    radarTitle: 'Profil moyen de la communauté',
    radarSegmentToggleLabel: 'Segment',
    radarHint:
      'Moyennes sur tous les profils listés et par taille d’entreprise (échelle 0–5). Les courbes « freelance », « PME » et « corporate » n’apparaissent que si le segment existe.',
    radarEmpty: 'Aucun profil à analyser.',
    radarAxisExport: 'Orientation export',
    radarAxisEvents: 'Appétence events',
    radarAxisNetworking: 'Besoins networking',
    radarAxisDigital: 'Maturité digitale',
    radarAxisTeamSize: 'Taille équipe',
    radarAxisExchange: 'Fréquence échanges',
    radarSeriesCommunity: 'Communauté (moyenne)',
    radarSegmentEmpty:
      'Aucune donnée pour ce segment avec les filtres actuels. Essayez « Communauté » ou élargissez les filtres.',
    vennTitle: "Centres d'intérêt croisés",
    vennHint:
      'Vue agrégée : cercles F&B et Networking (effectifs) ; le centre indique les deux à la fois. Afterwork et autres croisements sont détaillés en dessous.',
    vennProfileA: 'Profil A',
    vennProfileB: 'Profil B',
    vennIntersection: 'Commun',
    vennNoTags: 'Aucun membre avec les tags F&B ou Networking pour afficher ce diagramme.',
    vennExtrasTitle: 'Complément — afterwork & croisements',
    vennStatAfterworkTotal: 'Membres tag « Afterwork »',
    vennStatFbAfter: 'F&B ∩ Afterwork',
    vennStatNetAfter: 'Networking ∩ Afterwork',
    vennStatTriple: 'F&B ∩ Networking ∩ Afterwork',
    vennLegendFB: 'Intéressé par F&B',
    vennLegendNetworking: 'Intéressé par networking',
    vennLegendAfterwork: 'Intéressé par events afterwork',
    tableTitle: 'Membres & matching',
    filterSector: 'Secteur',
    filterCity: 'Ville',
    filterLanguage: 'Langue',
    filterNeeds: 'Besoins principaux',
    thName: 'Nom',
    thSector: 'Secteur',
    thLocation: 'Ville',
    thLanguages: 'Langues',
    thCompanySize: 'Taille',
    thTags: 'Tags',
    sizeFreelance: 'Freelance',
    sizePme: 'PME',
    sizeCorporate: 'Corporate',
    noResults: 'Aucun membre ne correspond aux filtres.',
  },
  en: {
    title: 'Explore profiles',
    subtitle:
      'Visualize community common points and discover relevant matches.',
    radarTitle: 'Average community profile',
    radarSegmentToggleLabel: 'Segment',
    radarHint:
      'Averages across all listed profiles and by company size (scale 0–5). Freelance, SME and corporate series only appear when that segment exists.',
    radarEmpty: 'No profiles to analyze.',
    radarAxisExport: 'Export orientation',
    radarAxisEvents: 'Event appetite',
    radarAxisNetworking: 'Networking needs',
    radarAxisDigital: 'Digital maturity',
    radarAxisTeamSize: 'Team size',
    radarAxisExchange: 'Exchange frequency',
    radarSeriesCommunity: 'Community (avg.)',
    radarSegmentEmpty:
      'No data for this segment with current filters. Try “Community” or broaden filters.',
    vennTitle: 'Overlapping interests',
    vennHint:
      'Aggregate view: F&B and Networking circle sizes (counts); center shows members with both. Afterwork and other overlaps are listed below.',
    vennProfileA: 'Profile A',
    vennProfileB: 'Profile B',
    vennIntersection: 'Shared',
    vennNoTags: 'No members with F&B or Networking tags to show this diagram.',
    vennExtrasTitle: 'More — afterwork & overlaps',
    vennStatAfterworkTotal: 'Members with “Afterwork” tag',
    vennStatFbAfter: 'F&B ∩ Afterwork',
    vennStatNetAfter: 'Networking ∩ Afterwork',
    vennStatTriple: 'F&B ∩ Networking ∩ Afterwork',
    vennLegendFB: 'Interested in F&B',
    vennLegendNetworking: 'Interested in networking',
    vennLegendAfterwork: 'Interested in afterwork events',
    tableTitle: 'Members & matching',
    filterSector: 'Sector',
    filterCity: 'City',
    filterLanguage: 'Language',
    filterNeeds: 'Main needs',
    thName: 'Name',
    thSector: 'Sector',
    thLocation: 'City',
    thLanguages: 'Languages',
    thCompanySize: 'Size',
    thTags: 'Tags',
    sizeFreelance: 'Freelancer',
    sizePme: 'SME',
    sizeCorporate: 'Corporate',
    noResults: 'No member matches the filters.',
  },
  es: {
    title: 'Explorar perfiles',
    subtitle:
      'Visualiza los puntos en común de la comunidad y descubre matches relevantes.',
    radarTitle: 'Perfil medio de la comunidad',
    radarSegmentToggleLabel: 'Segmento',
    radarHint:
      'Promedios sobre todos los perfiles y por tamaño de empresa (escala 0–5). Las series freelance, PyME y corporate solo aparecen si existe ese segmento.',
    radarEmpty: 'No hay perfiles para analizar.',
    radarAxisExport: 'Orientación a la exportación',
    radarAxisEvents: 'Apetencia por eventos',
    radarAxisNetworking: 'Necesidades de networking',
    radarAxisDigital: 'Madurez digital',
    radarAxisTeamSize: 'Tamaño del equipo',
    radarAxisExchange: 'Frecuencia de intercambio',
    radarSeriesCommunity: 'Comunidad (media)',
    radarSegmentEmpty:
      'Sin datos para este segmento con los filtros actuales. Prueba « Comunidad » o amplía los filtros.',
    vennTitle: 'Intereses cruzados',
    vennHint:
      'Vista agregada: tamaños F&B y Networking (recuentos); el centro muestra ambos tags. Afterwork y otros cruces se detallan abajo.',
    vennProfileA: 'Perfil A',
    vennProfileB: 'Perfil B',
    vennIntersection: 'Común',
    vennNoTags: 'Ningún miembro con tags F&B o Networking para este diagrama.',
    vennExtrasTitle: 'Complemento — afterwork y cruces',
    vennStatAfterworkTotal: 'Miembros con tag « Afterwork »',
    vennStatFbAfter: 'F&B ∩ Afterwork',
    vennStatNetAfter: 'Networking ∩ Afterwork',
    vennStatTriple: 'F&B ∩ Networking ∩ Afterwork',
    vennLegendFB: 'Interesado en F&B',
    vennLegendNetworking: 'Interesado en networking',
    vennLegendAfterwork: 'Interesado en eventos afterwork',
    tableTitle: 'Miembros y matching',
    filterSector: 'Sector',
    filterCity: 'Ciudad',
    filterLanguage: 'Idioma',
    filterNeeds: 'Necesidades principales',
    thName: 'Nombre',
    thSector: 'Sector',
    thLocation: 'Ciudad',
    thLanguages: 'Idiomas',
    thCompanySize: 'Tamaño',
    thTags: 'Tags',
    sizeFreelance: 'Freelance',
    sizePme: 'PyME',
    sizeCorporate: 'Corporate',
    noResults: 'Ningún miembro coincide con los filtros.',
  },
};

export function explorerProfilsT(lang: Language, key: string): string {
  const row = explorerProfilsTranslations[lang] ?? explorerProfilsTranslations.fr;
  return row[key] ?? explorerProfilsTranslations.fr[key] ?? key;
}

/** Hook léger : à utiliser avec la `lang` du contexte app (`useLanguage`) ou une prop. */
export function useExplorerProfilsI18n(lang: Language = 'fr') {
  const t = (key: string) => explorerProfilsT(lang, key);
  return { t, lang };
}
