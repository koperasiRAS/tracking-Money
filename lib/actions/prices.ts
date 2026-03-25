"use server";

import { fetchStockPrice, fetchMultiplePrices, getCachedPrices } from "@/lib/utils/finance";
import type { PriceData } from "@/types";

export async function getPrice(ticker: string): Promise<PriceData | null> {
  try {
    return await fetchStockPrice(ticker);
  } catch (error) {
    console.error("Failed to fetch price:", error);
    return null;
  }
}

export async function getPrices(tickers: string[]): Promise<Record<string, PriceData | null>> {
  try {
    const prices = await fetchMultiplePrices(tickers);
    const result: Record<string, PriceData | null> = {};

    tickers.forEach(ticker => {
      result[ticker.toUpperCase()] = prices.get(ticker.toUpperCase()) || null;
    });

    return result;
  } catch (error) {
    console.error("Failed to fetch prices:", error);
    return {};
  }
}

export async function getCachedPriceData(tickers: string[]): Promise<Record<string, PriceData | null>> {
  const cached = getCachedPrices(tickers);
  const result: Record<string, PriceData | null> = {};

  tickers.forEach(ticker => {
    const data = cached.get(ticker.toUpperCase());
    result[ticker.toUpperCase()] = data || null;
  });

  return result;
}

// Refresh prices in the background (for cron jobs)
export async function refreshPrices(tickers: string[]): Promise<Record<string, PriceData | null>> {
  return getPrices(tickers);
}
