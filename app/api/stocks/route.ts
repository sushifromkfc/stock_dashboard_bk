import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/stocks — 전체 종목 + 최신 key metrics
export async function GET() {
  const { data, error } = await supabase
    .from("stocks")
    .select(`
      *,
      stock_key_metrics (
        ebit_ttm,
        working_capital,
        net_ppe,
        total_debt,
        market_cap,
        fiscal_year,
        period,
        updated_at
      )
    `)
    .order("ticker");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 각 종목마다 가장 최신 metrics만 사용
  const stocks = data.map((stock) => {
    const metrics = stock.stock_key_metrics?.sort(
      (a: { updated_at: string }, b: { updated_at: string }) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0] ?? null;

    return {
      id: stock.id,
      ticker: stock.ticker,
      name_kr: stock.name_kr,
      name_en: stock.name_en,
      sector: stock.sector,
      exchange: stock.exchange,
      currency: stock.currency,
      metrics,
    };
  });

  return NextResponse.json(stocks);
}

// POST /api/stocks — 새 종목 추가
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ticker, name_kr, name_en, sector, exchange, currency } = body;

  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("stocks")
    .insert({
      ticker: ticker.toUpperCase(),
      name_kr,
      name_en,
      sector,
      exchange,
      currency: currency ?? "USD",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
