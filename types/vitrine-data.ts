export type VitrineHeroStats = {
  members_count: string;
  active_opportunities_count: string;
  month_growth_percent: string;
  sectors_count: string;
};

export type VitrineIndicators = {
  active_decision_makers: string;
  new_this_month: string;
  profile_views: string;
  introductions_started: string;
  potential_connections: string;
};

export type VitrineAffinity = {
  name: string;
  badge?: string;
  members: number;
  sectors_or_universes: number;
  sectors_or_universes_label: 'secteurs' | 'univers métier';
  insight: string;
};

export type VitrineAffinityInsights = {
  intro: string;
  bullets: string[];
  highlights: string[];
  closing: string;
};

export type VitrineSector = {
  name: string;
  count?: number | null;
};

export type VitrineGrowth = {
  headline: string;
  supporting_text: string;
  labels: string[];
  values?: number[];
  chart_y_max?: number;
  acceleration_label?: string;
  acceleration_text?: string;
  insight_title: string;
  insight_text: string;
  highlights: string[];
  closing: string;
};

export type VitrineRecentActivityItem = {
  sector: string;
  need: string;
  relative_date: string;
};

export type VitrineTopRequestedOpportunity = {
  category: string;
  count?: number | null;
};

export type VitrineActiveOpportunity = {
  category: string;
  badge?: string;
  requests: number;
  insight: string;
  url?: string;
};

export type VitrineOpportunityInsights = {
  intro: string;
  bullets: string[];
  closing: string;
};

export type VitrineRecentRequests = {
  headline: string;
  description: string;
  empty_state?: string;
  items?: Array<{
    title?: string;
    description?: string;
    category?: string;
    url?: string;
  }>;
  importance_title: string;
  importance_text: string;
  bullets: string[];
  closing: string;
};

export type VitrineCtaBlock = {
  title: string;
  body: string;
  support: string;
  cta: string;
  url?: string;
};

export type VitrineFooter = {
  brand: string;
  descriptor: string;
  website: string;
  signup: string;
  date_label: string;
  date_value: string;
  source: string;
};

export type VitrineData = {
  report_month_year_fr: string;
  extraction_date_fr_long: string;

  hero_stats: VitrineHeroStats;
  indicators: VitrineIndicators;

  affinities: VitrineAffinity[];
  affinity_insights: VitrineAffinityInsights;

  sectors: VitrineSector[];

  growth: VitrineGrowth;

  recent_activity: VitrineRecentActivityItem[];

  top_requested_opportunities: VitrineTopRequestedOpportunity[];

  active_opportunities: VitrineActiveOpportunity[];
  opportunity_insights: VitrineOpportunityInsights;

  recent_requests: VitrineRecentRequests;

  cta_blocks: VitrineCtaBlock[];

  footer: VitrineFooter;
};

