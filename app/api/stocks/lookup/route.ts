import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

function normalizeYahooTicker(ticker: string): string {
  return ticker.replace(".", "-");
}

// GET /api/stocks/lookup?ticker=AAPL
export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  const yahooTicker = normalizeYahooTicker(ticker.toUpperCase());

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary: any = await yf.quoteSummary(yahooTicker, {
      modules: ["price", "assetProfile"],
    });

    return NextResponse.json({
      name_en: summary?.price?.longName ?? summary?.price?.shortName ?? null,
      sector: summary?.assetProfile?.sector ?? null,
      exchange: summary?.price?.exchangeName ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
