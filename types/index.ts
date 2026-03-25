export interface PortfolioItem {
  id: string;
  userId: string;
  ticker: string;
  name: string | null;
  shares: number;
  avgPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  ticker: string;
  name: string | null;
  type: "stock" | "fund";
  createdAt: string;
}

export type AlertType = "buy" | "avg_down" | "warning" | "default";

export interface Alert {
  id: string;
  userId: string;
  ticker: string;
  name: string | null;
  condition: "above" | "below";
  targetPrice: number;
  isActive: boolean;
  lastTriggered: string | null;
  createdAt: string;
  alertType?: AlertType;
  priority?: number;
}

export interface MutualFund {
  id: string;
  userId: string;
  fundName: string;
  ticker: string | null;
  units: number;
  nav: number;
  purchaseDate: string;
  createdAt: string;
}

export interface PriceData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  marketCap?: string;
  volume?: string;
}

export interface UserSettings {
  telegramToken?: string;
  telegramChatId?: string;
}
