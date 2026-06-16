import YahooFinance from "yahoo-finance2";
import { FmpMetrics } from "./fmp";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export type YahooResult = FmpMetrics & {
  sector: string | null;
};

export async function fetchYahooMetrics(ticker: string): Promise<YahooResult> {
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - 3);
  const period1Str = period1.toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fundamentals, summary]: [any[], any] = await Promise.all([
    yf.fundamentalsTimeSeries(ticker, {
      period1: period1Str,
      type: "annual",
      module: "all",
    }) as Promise<any[]>,
    yf.quoteSummary(ticker, {
      modules: ["price", "assetProfile"],
    }) as Promise<any>,
  ]);

  // Most recent annual data point
  const latest = fundamentals?.[fundamentals.length - 1] ?? null;

  return {
    ebit_ttm: latest?.EBIT ?? latest?.operatingIncome ?? null,
    working_capital: latest?.workingCapital ?? null,
    net_ppe: latest?.netPPE ?? null,
    total_debt: latest?.totalDebt ?? null,
    market_cap: summary?.price?.marketCap ?? null,
    sector: summary?.assetProfile?.sector ?? null,
  };
}
