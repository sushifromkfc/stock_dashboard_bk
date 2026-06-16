import yahooFinance from "yahoo-finance2";
import { FmpMetrics } from "./fmp";

export async function fetchYahooMetrics(ticker: string): Promise<FmpMetrics> {
  const result = await yahooFinance.quoteSummary(
    ticker,
    { modules: ["incomeStatementHistory", "balanceSheetHistory", "price"] },
    { validateResult: false }
  );

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
    ebit_ttm:
      (income?.ebit as number | undefined) ??
      (income?.operatingIncome as number | undefined) ??
      null,
    working_capital,
    net_ppe: (balance?.propertyPlantEquipment as number | undefined) ?? null,
    total_debt,
    market_cap: (price?.marketCap as number | undefined) ?? null,
  };
}
