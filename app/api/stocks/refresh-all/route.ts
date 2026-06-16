import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchYahooMetrics } from "@/lib/yahoo";

// POST /api/stocks/refresh-all
export async function POST() {
  // 1. 전체 종목 목록 가져오기
  const { data: stocks, error } = await supabase
    .from("stocks")
    .select("id, ticker");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { ticker: string; status: "ok" | "error"; error?: string }[] = [];

  // 2. 순차 처리 (Yahoo Finance rate limit 보호용 딜레이)
  for (const stock of stocks) {
    try {
      const metrics = await fetchYahooMetrics(stock.ticker);

      const { error: upsertError } = await supabase
        .from("stock_key_metrics")
        .upsert(
          {
            stock_id: stock.id,
            period: "TTM",
            ...metrics,
            data_source: "yahoo",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stock_id,period" }
        );

      if (upsertError) throw new Error(upsertError.message);

      results.push({ ticker: stock.ticker, status: "ok" });
    } catch (err) {
      results.push({ ticker: stock.ticker, status: "error", error: String(err) });
    }

    // FMP 무료 플랜: 초당 10 requests 제한 보호
    await new Promise((r) => setTimeout(r, 150));
  }

  const succeeded = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ succeeded, failed, results });
}
