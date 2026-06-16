export type Stock = {
  id: string;
  ticker: string;
  name_kr: string;
  name_en: string;
  sector: string;
  exchange: string;
  currency: string;
  metrics: KeyMetrics | null;
};

export type KeyMetrics = {
  ebit_ttm: number | null;
  working_capital: number | null;
  net_ppe: number | null;
  total_debt: number | null;
  market_cap: number | null;
  updated_at: string | null;
};
