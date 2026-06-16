export function formatNumber(
  value: number | null | undefined,
  currency = "USD"
): string {
  if (value === null || value === undefined) return "—";

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const prefix = currency === "USD" ? "$" : "";

  if (abs >= 1_000_000_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${prefix}${(abs / 1_000_000).toFixed(2)}M`;
  }
  return `${sign}${prefix}${abs.toLocaleString()}`;
}
