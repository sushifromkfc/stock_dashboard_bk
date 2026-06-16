import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchYahooMetrics } from "@/lib/yahoo";

// POST /api/stocks/[ticker]/refresh
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  // 1. stocks 테이블에서 stock_id 조회
  const { data: stock, error: stockError } = await supabase
    .from("stocks")
    .select("id")
    .eq("ticker", upperTicker)
    .single();

  if (stockError || !stock) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  // 2. Yahoo Finance에서 재무 데이터 가져오기
  let metrics;
  try {
    metrics = await fetchYahooMetrics(upperTicker);
  } catch (err) {
    return NextResponse.json(
      { error: `Yahoo Finance fetch failed: ${err}` },
      { status: 502 }
    );
  }

  const { sector, ...financialMetrics } = metrics;

  // 3. stock_key_metrics에 upsert
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

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // 4. 섹터 업데이트 (값이 있을 때만)
  if (sector) {
    await supabase
      .from("stocks")
      .update({ sector })
      .eq("id", stock.id);
  }

  return NextResponse.json({ ticker: upperTicker, ...metrics });
}
