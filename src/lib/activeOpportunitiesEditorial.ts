import type { Language } from '@/types';

/**
 * Sous-lignes d’interprétation par clé de catégorie (clé = `NeedChartRow.key` / agrégat needs).
 */
const SUB: Record<
  string,
  { fr: string; en: string; es: string }
> = {
  partners: {
    fr: 'Des entreprises cherchent déjà des relais business locaux',
    en: 'Companies are already looking for local business relays',
    es: 'Empresas que ya buscan relés comerciales locales',
  },
  distributors: {
    fr: 'Un besoin fort pour développer la mise sur le marché',
    en: 'Strong demand to grow go-to-market reach',
    es: 'Demanda fuerte para impulsar la puesta en el mercado',
  },
  experts: {
    fr: 'Les membres recherchent des relais de confiance sur place',
    en: 'Members look for trusted on-the-ground contacts',
    es: 'Los miembros buscan contactos de confianza en el territorio',
  },
  suppliers: {
    fr: 'Le réseau sert aussi à sécuriser l’approvisionnement',
    en: 'The network also helps secure supply',
    es: 'La red también ayuda a asegurar el abastecimiento',
  },
  investors: {
    fr: 'Des besoins ciblés autour du financement et du développement',
    en: 'Targeted needs around funding and growth',
    es: 'Necesidades concretas de financiamiento y crecimiento',
  },
  other: {
    fr: 'Des demandes plus transversales émergent aussi',
    en: 'Broader, cross-cutting needs are emerging too',
    es: 'También surgen necesidades más transversales',
  },
  clients: {
    fr: 'Recherche de clients et de débouchés qualifiés',
    en: 'Looking for clients and qualified opportunities',
    es: 'Búsqueda de clientes y oportunidades cualificadas',
  },
  talent: {
    fr: 'Besoins autour du recrutement et des talents',
    en: 'Needs around hiring and talent',
    es: 'Necesidades de talento y reclutamiento',
  },
  visibility: {
    fr: 'Visibilité, communication et rayonnement',
    en: 'Visibility, communication, and reach',
    es: 'Visibilidad, comunicación y proyección',
  },
};

const GENERIC = {
  fr: 'Besoin actif exprimé par des membres du réseau',
  en: 'Active need expressed by network members',
  es: 'Necesidad activa expresada por miembros de la red',
};

export function getOpportunitySubline(categoryKey: string, lang: Language): string {
  const row = SUB[categoryKey];
  if (!row) return GENERIC[lang];
  return row[lang];
}
