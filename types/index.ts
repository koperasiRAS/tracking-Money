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

export type DCAFrequency = "weekly" | "biweekly" | "monthly" | "quarterly";

export type DividendFrequency = "monthly" | "quarterly" | "semiannual" | "annual";

export interface DividendSchedule {
  id: string;
  userId: string;
  ticker: string;
  name: string | null;
  annualYieldPercent: number;
  dividendPerShare: number;
  frequency: DividendFrequency;
  nextExDate: string | null;
  nextPayDate: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface DividendRecord {
  id: string;
  userId: string;
  ticker: string;
  exDate: string;
  payDate: string | null;
  amountPerShare: number;
  totalReceived: number | null;
  sharesCount: number | null;
  currency: string;
  notes?: string | null;
  createdAt: string;
}

export interface DividendForecast {
  ticker: string;
  name: string | null;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  annualDividend: number; // projected annual dividend
  dividendPerShare: number;
  yieldPercent: number;
  frequency: DividendFrequency;
  nextExDate: string | null;
  nextPayDate: string | null;
  projectedIncome: number; // shares * dividendPerShare adjusted for frequency
  annualizedIncome: number; // normalized to annual
}

export interface DCASchedule {
  id: string;
  userId: string;
  ticker: string;
  name: string | null;
  amount: number;
  frequency: DCAFrequency;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  isActive: boolean;
  lastTriggered: string | null;
  nextDue: string;
  notes?: string | null;
  createdAt: string;
}
