export interface AnalyticsTotals {
  forms: number;
  publishedForms: number;
  submissions: number;
  last7Days: number;
  previous7Days: number;
}

export interface TimelinePoint {
  date: string;
  label: string;
  count: number;
}

export interface PerFormStats {
  formId: string;
  name: string;
  slug: string;
  published: boolean;
  total: number;
  inRange: number;
  lastSubmissionAt: string | null;
}

export interface AnalyticsOverview {
  range: number;
  totals: AnalyticsTotals;
  timeline: TimelinePoint[];
  perForm: PerFormStats[];
}

export type AnalyticsRange = 7 | 30 | 90;
