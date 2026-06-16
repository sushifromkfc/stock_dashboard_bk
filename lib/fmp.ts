const FMP_BASE = "https://financialmodelingprep.com/stable";
const API_KEY = process.env.FMP_API_KEY!;

export type FmpMetrics = {
  ebit_ttm: number | null;
  working_capital: number | null;
  net_ppe: number | null;
  total_debt: number | null;
  market_cap: number | null;
};

async function fmpFetch<T>(endpoint: string, symbol: string, extra = ""): Promise<T> {
  const url = `${FMP_BASE}/${endpoint}?symbol=${symbol}${extra}&apikey=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`FMP error: ${res.status} /${endpoint}?symbol=${symbol}`);
  return res.json();
}

// FMP uses hyphens for tickers with dots (e.g. BRK.B → BRK-B)
function normalizeTicker(ticker: string): string {
  return ticker.replace(".", "-");
}

export async function fetchFmpMetrics(ticker: string): Promise<FmpMetrics> {
  const fmpTicker = normalizeTicker(ticker);
  const [incomeData, balanceData, profileData] = await Promise.all([
    fmpFetch<IncomeStatement[]>("income-statement", fmpTicker, "&limit=1"),
    fmpFetch<BalanceSheet[]>("balance-sheet-statement", fmpTicker, "&limit=1"),
    fmpFetch<Profile[]>("profile", fmpTicker),
  ]);

  const income = Array.isArray(incomeData) ? incomeData[0] ?? null : null;
  const balance = Array.isArray(balanceData) ? balanceData[0] ?? null : null;
  const profile = Array.isArray(profileData) ? profileData[0] ?? null : null;

  const currentAssets = balance?.totalCurrentAssets ?? null;
  const currentLiabilities = balance?.totalCurrentLiabilities ?? null;
  const working_capital =
    currentAssets !== null && currentLiabilities !== null
      ? currentAssets - currentLiabilities
      : null;

  return {
    ebit_ttm: income?.ebit ?? income?.operatingIncome ?? null,
    working_capital,
    net_ppe: balance?.propertyPlantEquipmentNet ?? null,
    total_debt: balance?.totalDebt ?? null,
    market_cap: profile?.marketCap ?? null,
  };
}

// FMP response types
type IncomeStatement = {
  ebit?: number;
  operatingIncome?: number;
};

type BalanceSheet = {
  totalCurrentAssets?: number;
  totalCurrentLiabilities?: number;
  propertyPlantEquipmentNet?: number;
  totalDebt?: number;
};

type Profile = {
  marketCap?: number;
};
