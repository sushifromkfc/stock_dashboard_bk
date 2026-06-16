import { YahooFinance } from "yahoo-finance2";
import { FmpMetrics } from "./fmp";

const yf = new YahooFinance();

export async function fetchYahooMetrics(ticker: string): Promise<FmpMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await yf.quoteSummary(ticker, {
    modules: ["incomeStatementHistory", "balanceSheetHistory", "price"],
  });

  const income = result.incomeStatementHistory?.incomeStatementHistory?.[0];
  const balance = result.balanceSheetHistory?.balanceSheetHistory?.[0];
  const price = result.price;

  const currentAssets = balance?.totalCurrentAssets ?? null;
  const currentLiabilities = balance?.totalCurrentLiabilities ?? null;
  const working_capital =
    currentAssets !== null && currentLiabilities !== null
      ? currentAssets - currentLiabilities
      : null;

  const shortTermDebt = balance?.shortLongTermDebt ?? 0;
  const longTermDebt = balance?.longTermDebt ?? 0;
  const total_debt =
    shortTermDebt || longTermDebt ? shortTermDebt + longTermDebt : null;

  return {
    ebit_ttm: income?.ebit ?? income?.operatingIncome ?? null,
    working_capital,
    net_ppe: balance?.propertyPlantEquipment ?? null,
    total_debt,
    market_cap: price?.marketCap ?? null,
  };
}
