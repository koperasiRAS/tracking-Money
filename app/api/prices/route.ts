import { NextResponse } from "next/server";
import { fetchStockPrice, fetchMultiplePrices } from "@/lib/utils/finance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");
  const tickers = searchParams.get("tickers");

  try {
    if (ticker) {
      // Single ticker
      const price = await fetchStockPrice(ticker);
      if (!price) {
        return NextResponse.json(
          { error: "Failed to fetch price" },
          { status: 404 }
        );
      }
      return NextResponse.json(price);
    }

    if (tickers) {
      // Multiple tickers
      const tickerList = tickers.split(",").map(t => t.trim().toUpperCase());
      const prices = await fetchMultiplePrices(tickerList);

      const result: Record<string, unknown> = {};
      tickerList.forEach(ticker => {
        const price = prices.get(ticker);
        result[ticker] = price || null;
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Missing ticker or tickers parameter" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Price API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
