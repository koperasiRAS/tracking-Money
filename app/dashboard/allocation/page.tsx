"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PortfolioItem } from "@/types";
import { getPortfolio } from "@/lib/actions/portfolio";
import { getPrices } from "@/lib/actions/prices";
import type { PriceData } from "@/types";

type RiskProfile = "conservative" | "moderate" | "aggressive";
type InvestmentGoal = "retirement" | "house" | "education" | "wealth" | "passive_income";

interface AllocationRecommendation {
  category: string;
  currentPercent: number;
  targetPercent: number;
  currentValue: number;
  targetValue: number;
  difference: number;
  differencePercent: number;
  color: string;
}

interface CategoryInfo {
  name: string;
  description: string;
  color: string;
  defaultPercent: number;
}

// Asset allocation templates by risk profile
const RISK_PROFILES: Record<RiskProfile, { label: string; description: string; stocks: number; bonds: number; cash: number; crypto: number }> = {
  conservative: {
    label: "Conservative",
    description: "Focus on capital preservation with lower risk",
    stocks: 40,
    bonds: 50,
    cash: 10,
    crypto: 0,
  },
  moderate: {
    label: "Moderate",
    description: "Balanced approach between growth and stability",
    stocks: 60,
    bonds: 30,
    cash: 5,
    crypto: 5,
  },
  aggressive: {
    label: "Aggressive",
    description: "Maximum growth focus with higher risk",
    stocks: 80,
    bonds: 10,
    cash: 0,
    crypto: 10,
  },
};

// Sector allocation for Indonesian stocks
const SECTOR_CATEGORIES: Record<string, { label: string; color: string; risk: "low" | "medium" | "high" }> = {
  BANK: { label: "Banking & Financial", color: "blue", risk: "medium" },
  FNB: { label: "Food & Beverage", color: "green", risk: "low" },
  INFRA: { label: "Infrastructure", color: "purple", risk: "medium" },
  PROPERTY: { label: "Property & Real Estate", color: "orange", risk: "medium" },
  MINING: { label: "Mining", color: "red", risk: "high" },
  CONSUMER: { label: "Consumer Goods", color: "cyan", risk: "low" },
  ENERGY: { label: "Energy", color: "yellow", risk: "high" },
  HEALTH: { label: "Healthcare", color: "pink", risk: "medium" },
  TECH: { label: "Technology", color: "indigo", risk: "high" },
  OTHER: { label: "Other", color: "gray", risk: "medium" },
};

function getSector(ticker: string): string {
  const upper = ticker.toUpperCase();
  if (upper.includes("BBCA") || upper.includes("BBRI") || upper.includes("BMRI") || upper.includes("BTPN")) return "BANK";
  if (upper.includes("ICBP") || upper.includes("INDF") || upper.includes("GOOD") || upper.includes("MSKY")) return "FNB";
  if (upper.includes("ISAT") || upper.includes("EXCL") || upper.includes("TLKM") || upper.includes("MUNC")) return "INFRA";
  if (upper.includes("BSDE") || upper.includes("PWON") || upper.includes("CTRA") || upper.includes("LPKR")) return "PROPERTY";
  if (upper.includes("UNTR") || upper.includes("BYAN") || upper.includes("ADRO") || upper.includes("ITMG")) return "MINING";
  if (upper.includes("UNVR") || upper.includes("HMSP") || upper.includes("KLBF") || upper.includes("WMP")) return "CONSUMER";
  if (upper.includes("PGAS") || upper.includes("PERT") || upper.includes("MEDC") || upper.includes("AKRA")) return "ENERGY";
  if (upper.includes("HELI") || upper.includes("PRDA") || upper.includes("SILO")) return "HEALTH";
  return "OTHER";
}

export default function AllocationPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  // User profile
  const [age, setAge] = useState("30");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("moderate");
  const [goal, setGoal] = useState<InvestmentGoal>("retirement");
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (portfolio.length > 0) {
      const tickers = portfolio.map((p) => p.ticker);
      getPrices(tickers).then(setPrices);
    }
  }, [portfolio]);

  useEffect(() => {
    // Calculate total value
    const total = portfolio.reduce((sum, item) => {
      const priceData = prices[item.ticker];
      const currentPrice = priceData?.price || item.avgPrice;
      return sum + item.shares * currentPrice;
    }, 0);
    setTotalValue(total);
  }, [portfolio, prices]);

  const loadPortfolio = async () => {
    setIsLoading(true);
    try {
      const data = await getPortfolio();
      setPortfolio(data);
    } catch (error) {
      console.error("Failed to load portfolio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate age-based recommendation
  const ageBasedStocks = Math.max(20, 110 - parseInt(age || "30"));
  const ageBasedBonds = 100 - ageBasedStocks;

  // Get risk profile allocation
  const riskAllocation = RISK_PROFILES[riskProfile];

  // Calculate current allocation by category
  const currentAllocation = portfolio.reduce((acc, item) => {
    const priceData = prices[item.ticker];
    const currentPrice = priceData?.price || item.avgPrice;
    const value = item.shares * currentPrice;
    const sector = getSector(item.ticker);
    acc[sector] = (acc[sector] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  // Build recommendations
  const categories = [
    { key: "stocks", name: "Stocks (EQ)", color: "blue" },
    { key: "bonds", name: "Bonds / Reksadana", color: "green" },
    { key: "cash", name: "Cash / Savings", color: "yellow" },
    { key: "crypto", name: "Crypto / Speculative", color: "purple" },
  ];

  const recommendations: AllocationRecommendation[] = categories.map((cat) => {
    const targetPercent = riskAllocation[cat.key as keyof typeof riskAllocation] as number;
    const targetValue = totalValue * (targetPercent / 100);
    const currentValue = currentAllocation[cat.key] || 0;
    const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    const difference = targetValue - currentValue;
    const differencePercent = targetPercent - currentPercent;

    return {
      category: cat.name,
      currentPercent,
      targetPercent,
      currentValue,
      targetValue,
      difference,
      differencePercent,
      color: cat.color,
    };
  });

  // Sector allocation analysis
  const sectorAllocations = Object.entries(currentAllocation)
    .map(([sector, value]) => ({
      sector,
      sectorInfo: SECTOR_CATEGORIES[sector] || SECTOR_CATEGORIES.OTHER,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate risk level based on sector mix
  const portfolioRisk = sectorAllocations.reduce((sum, s) => {
    const riskWeight = s.sectorInfo.risk === "high" ? 3 : s.sectorInfo.risk === "medium" ? 2 : 1;
    return sum + (s.value / totalValue) * riskWeight;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500",
      red: "bg-red-500",
      orange: "bg-orange-500",
      cyan: "bg-cyan-500",
      pink: "bg-pink-500",
      indigo: "bg-indigo-500",
      gray: "bg-gray-500",
    };
    return colors[color] || colors.gray;
  };

  const getTextColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: "text-blue-400",
      green: "text-green-600",
      yellow: "text-yellow-400",
      purple: "text-purple-400",
      red: "text-red-500",
      orange: "text-orange-400",
      cyan: "text-cyan-400",
      pink: "text-pink-400",
      indigo: "text-indigo-400",
      gray: "text-gray-4000",
    };
    return colors[color] || colors.gray;
  };

  const needsRebalancing = recommendations.some((r) => Math.abs(r.differencePercent) > 10);

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Smart Allocation</h1>
        <p className="text-gray-500 mt-1">Analyze and optimize your portfolio allocation</p>
      </div>

      {/* User Profile */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <GlassInput
            label="Age"
            type="number"
            min="18"
            max="80"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <GlassSelect
            label="Risk Tolerance"
            value={riskProfile}
            onChange={(e) => setRiskProfile(e.target.value as RiskProfile)}
            options={[
              { value: "conservative", label: "🛡️ Conservative — Low risk, stable returns" },
              { value: "moderate", label: "⚖️ Moderate — Balanced growth" },
              { value: "aggressive", label: "🚀 Aggressive — High risk, high reward" },
            ]}
          />
          <GlassSelect
            label="Investment Goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value as InvestmentGoal)}
            options={[
              { value: "retirement", label: "🏖️ Retirement — Long term" },
              { value: "house", label: "🏠 House — Medium term (3-5 years)" },
              { value: "education", label: "🎓 Education — Medium term" },
              { value: "wealth", label: "💎 Wealth Building — Long term" },
              { value: "passive_income", label: "💰 Passive Income — Dividends focus" },
            ]}
          />
        </div>
      </GlassCard>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          <p className="text-gray-500 text-sm">Total Value</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className={`text-2xl font-bold ${portfolioRisk > 2.2 ? "text-red-500" : portfolioRisk > 1.8 ? "text-yellow-400" : "text-green-600"}`}>
            {portfolioRisk.toFixed(1)}
          </p>
          <p className="text-gray-500 text-sm">Risk Score (1-3)</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{ageBasedStocks}%</p>
          <p className="text-gray-500 text-sm">Age-Based Stocks</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className={`text-2xl font-bold ${needsRebalancing ? "text-yellow-400" : "text-green-600"}`}>
            {needsRebalancing ? "⚠️ Rebalance" : "✅ Balanced"}
          </p>
          <p className="text-gray-500 text-sm">Status</p>
        </GlassCard>
      </div>

      {/* Allocation Comparison */}
      {isLoading ? (
        <GlassCard className="p-6">
          <Skeleton className="h-64 w-full" />
        </GlassCard>
      ) : portfolio.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No stocks in portfolio</h3>
          <p className="text-gray-500 text-sm">Add stocks to your portfolio to see allocation analysis</p>
        </GlassCard>
      ) : (
        <>
          {/* Allocation Table */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommended Allocation</h2>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-900 font-medium">{rec.category}</span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-gray-500">
                        Current: <span className="text-gray-900">{rec.currentPercent.toFixed(1)}%</span>
                      </span>
                      <span className="text-gray-500">
                        Target: <span className="text-gray-900">{rec.targetPercent}%</span>
                      </span>
                      <span className={rec.differencePercent > 0 ? "text-green-600" : rec.differencePercent < 0 ? "text-red-500" : "text-gray-500"}>
                        {rec.differencePercent > 0 ? "+" : ""}{rec.differencePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 h-6">
                    <div className="relative flex-1 bg-gray-100 rounded-full overflow-hidden">
                      {/* Current allocation */}
                      <div
                        className={`absolute inset-y-0 left-0 ${getColorClass(rec.color)} opacity-50`}
                        style={{ width: `${Math.min(100, rec.currentPercent)}%` }}
                      />
                      {/* Target allocation */}
                      <div
                        className={`absolute inset-y-0 left-0 border-r-2 border-white ${getColorClass(rec.color)}`}
                        style={{ width: `${rec.targetPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{formatCurrency(rec.currentValue)}</span>
                    <span>{formatCurrency(rec.targetValue)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">
                <span className="text-gray-900 font-medium">Legend:</span> Solid bar = current allocation, Border = target allocation.
                Bars showing more/less than target indicate rebalancing needed.
              </p>
            </div>
          </GlassCard>

          {/* Sector Analysis */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sector Diversification</h2>
            <div className="space-y-3">
              {sectorAllocations.map((s) => (
                <div key={s.sector} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${getColorClass(s.sectorInfo.color)}`} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-gray-900 text-sm">{s.sectorInfo.label}</span>
                      <span className={`text-sm ${getTextColorClass(s.sectorInfo.color)}`}>
                        {s.percent.toFixed(1)}% ({formatCurrency(s.value)})
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getColorClass(s.sectorInfo.color)}`}
                        style={{ width: `${s.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Rebalancing Suggestions */}
          {needsRebalancing && (
            <GlassCard className="p-6 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-yellow-400 font-medium">Rebalancing Suggested</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Your portfolio allocation differs from your target by more than 10%.
                    Consider {recommendations.find((r) => r.difference > 0)
                      ? `adding ${formatCurrency(recommendations.find((r) => r.difference > 0)?.difference || 0)} to underweight categories`
                      : "selling overweight categories"
                    } to maintain optimal risk profile.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* Age-Based Rule Reference */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-900 font-medium">Allocation Guidelines</p>
            <div className="text-gray-500 text-sm mt-2 space-y-1">
              <p><span className="text-gray-900">Age Rule:</span> Stocks % = 110 - Age. If you&apos;re {age || 30}, recommended stocks = {ageBasedStocks}%</p>
              <p><span className="text-gray-900">Risk Profiles:</span> Adjust based on your comfort with volatility and investment timeline</p>
              <p><span className="text-gray-900">Goal Adjustment:</span> Longer goals (retirement) = more stocks. Shorter goals (house) = more bonds/cash</p>
              <p><span className="text-gray-900">Sector Diversification:</span> Aim for no single sector exceeding 25% of portfolio</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </main>
  );
}
