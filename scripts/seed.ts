import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oixsotjrvqvbneqpzakg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9peHNvdGpydnF2Ym5lcXB6YWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTc1MzksImV4cCI6MjA5NzEzMzUzOX0.eY-VjYPl88WfMjiENb2TBe6TQ5i1u2RXCL_XBPlDOt0"
);

const stocks = [
  { ticker: "AAPL", name_kr: "애플", name_en: "Apple Inc.", sector: "Technology", exchange: "NASDAQ" },
  { ticker: "MSFT", name_kr: "마이크로소프트", name_en: "Microsoft Corporation", sector: "Technology", exchange: "NASDAQ" },
  { ticker: "GOOGL", name_kr: "알파벳", name_en: "Alphabet Inc.", sector: "Communication Services", exchange: "NASDAQ" },
  { ticker: "AMZN", name_kr: "아마존", name_en: "Amazon.com Inc.", sector: "Consumer Discretionary", exchange: "NASDAQ" },
  { ticker: "NVDA", name_kr: "엔비디아", name_en: "NVIDIA Corporation", sector: "Technology", exchange: "NASDAQ" },
  { ticker: "META", name_kr: "메타", name_en: "Meta Platforms Inc.", sector: "Communication Services", exchange: "NASDAQ" },
  { ticker: "BRK.B", name_kr: "버크셔 해서웨이", name_en: "Berkshire Hathaway Inc.", sector: "Financials", exchange: "NYSE" },
  { ticker: "JNJ", name_kr: "존슨앤존슨", name_en: "Johnson & Johnson", sector: "Health Care", exchange: "NYSE" },
  { ticker: "JPM", name_kr: "JP모건", name_en: "JPMorgan Chase & Co.", sector: "Financials", exchange: "NYSE" },
  { ticker: "V", name_kr: "비자", name_en: "Visa Inc.", sector: "Financials", exchange: "NYSE" },
  { ticker: "XOM", name_kr: "엑슨모빌", name_en: "Exxon Mobil Corporation", sector: "Energy", exchange: "NYSE" },
  { ticker: "UNH", name_kr: "유나이티드헬스", name_en: "UnitedHealth Group Inc.", sector: "Health Care", exchange: "NYSE" },
  { ticker: "TSLA", name_kr: "테슬라", name_en: "Tesla Inc.", sector: "Consumer Discretionary", exchange: "NASDAQ" },
  { ticker: "ADBE", name_kr: "어도비", name_en: "Adobe Inc.", sector: "Technology", exchange: "NASDAQ" },
  { ticker: "AMD", name_kr: "AMD", name_en: "Advanced Micro Devices Inc.", sector: "Technology", exchange: "NASDAQ" },
  { ticker: "PG", name_kr: "프록터앤갬블", name_en: "Procter & Gamble Co.", sector: "Consumer Staples", exchange: "NYSE" },
  { ticker: "KO", name_kr: "코카콜라", name_en: "The Coca-Cola Company", sector: "Consumer Staples", exchange: "NYSE" },
  { ticker: "NKE", name_kr: "나이키", name_en: "Nike Inc.", sector: "Consumer Discretionary", exchange: "NYSE" },
  { ticker: "DIS", name_kr: "월트디즈니", name_en: "The Walt Disney Company", sector: "Communication Services", exchange: "NYSE" },
  { ticker: "WMT", name_kr: "월마트", name_en: "Walmart Inc.", sector: "Consumer Staples", exchange: "NYSE" },
];

async function seed() {
  console.log(`Inserting ${stocks.length} stocks...`);

  const { data, error } = await supabase
    .from("stocks")
    .upsert(stocks, { onConflict: "ticker" })
    .select();

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log(`Done. Inserted ${data.length} stocks.`);
}

seed();
