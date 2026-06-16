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
  let apiStructureErrors = 0;

  // 2. 순차 처리
  for (const stock of stocks) {
    try {
      const metrics = await fetchYahooMetrics(stock.ticker);
      const { sector, ...financialMetrics } = metrics;

      const { error: upsertError } = await supabase
        .from("stock_key_metrics")
        .upsert(
          {
            stock_id: stock.id,
            period: "TTM",
            ...financialMetrics,
            data_source: "yahoo",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stock_id,period" }
        );

      if (upsertError) throw new Error(upsertError.message);

      // 섹터 업데이트
      if (sector) {
        await supabase
          .from("stocks")
          .update({ sector })
          .eq("id", stock.id);
      }

      results.push({ ticker: stock.ticker, status: "ok" });
    } catch (err) {
      const errStr = String(err);
      if (errStr.includes("YAHOO_API_STRUCTURE_CHANGED")) apiStructureErrors++;
      results.push({ ticker: stock.ticker, status: "error", error: errStr });
    }

    // rate limit 보호용 딜레이
    await new Promise((r) => setTimeout(r, 200));
  }

  const succeeded = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "error").length;

  // API 구조 변경 감지: 전체 종목의 30% 이상에서 구조 오류 발생 시 경고
  const apiStructureChanged =
    stocks.length > 0 && apiStructureErrors / stocks.length >= 0.3;

  return NextResponse.json({ succeeded, failed, results, apiStructureChanged });
}
