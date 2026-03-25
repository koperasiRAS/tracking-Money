import type { PriceData } from "@/types";

// In-memory cache for price data
const priceCache = new Map<string, {
  data: PriceData;
  timestamp: number;
}>();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Indonesian stock tickers with .JK suffix for Yahoo Finance
const getYahooTicker = (ticker: string): string => {
  // If already has suffix, return as is
  if (ticker.includes(".JK")) return ticker;
  // Add Jakarta Stock Exchange suffix for Indonesian stocks
  return `${ticker}.JK`;
};

export async function fetchStockPrice(ticker: string): Promise<PriceData | null> {
  const cacheKey = ticker.toUpperCase();
  const cached = priceCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const yahooTicker = getYahooTicker(cacheKey);

    // Using Yahoo Finance API via query endpoint
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=1d&range=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 300 }, // Next.js cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch price for ${ticker}: ${response.status}`);
      // Return cached data if available, even if expired
      return cached?.data || null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      console.error(`No data returned for ${ticker}`);
      return cached?.data || null;
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    if (!meta || !quote) {
      return cached?.data || null;
    }

    const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
    const previousClose = meta.previousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    const priceData: PriceData = {
      ticker: cacheKey,
      name: meta.shortName || meta.symbol || cacheKey,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      previousClose: previousClose,
      marketCap: meta.marketCap ? formatMarketCap(meta.marketCap) : undefined,
      volume: meta.regularMarketVolume ? formatVolume(meta.regularMarketVolume) : undefined,
    };

    // Update cache
    priceCache.set(cacheKey, {
      data: priceData,
      timestamp: Date.now(),
    });

    return priceData;
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    // Return cached data if available
    return cached?.data || null;
  }
}

export async function fetchMultiplePrices(tickers: string[]): Promise<Map<string, PriceData>> {
  const results = new Map<string, PriceData>();

  // Fetch in parallel with a limit
  const batchSize = 5;
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    const promises = batch.map(ticker => fetchStockPrice(ticker));
    const prices = await Promise.all(promises);

    prices.forEach((price, index) => {
      if (price) {
        results.set(batch[index].toUpperCase(), price);
      }
    });
  }

  return results;
}

export function getCachedPrices(tickers: string[]): Map<string, PriceData> {
  const results = new Map<string, PriceData>();
  const now = Date.now();

  tickers.forEach(ticker => {
    const cached = priceCache.get(ticker.toUpperCase());
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      results.set(ticker.toUpperCase(), cached.data);
    }
  });

  return results;
}

// Format market cap for display
function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  return value.toString();
}

// Format volume for display
function formatVolume(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toString();
}

// Clear cache (useful for forced refresh)
export function clearPriceCache() {
  priceCache.clear();
}
