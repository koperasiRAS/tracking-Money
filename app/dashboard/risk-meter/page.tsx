"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PortfolioItem } from "@/types";
import { getPortfolio } from "@/lib/actions/portfolio";
import { getPrices } from "@/lib/actions/prices";
import type { PriceData } from "@/types";

interface RiskMetrics {
  ticker: string;
  name: string;
  value: number;
  weight: number;
  beta: number; // simulated beta based on sector
  volatility: "low" | "medium" | "high";
  riskScore: number;
}

interface PortfolioRiskSummary {
  totalValue: number;
  weightedBeta: number;
  overallRisk: number;
  riskLevel: "low" | "medium" | "high" | "very_high";
  diversificationScore: number;
  concentrationRisk: string;
  recommendations: string[];
}

// Sector risk profiles (simplified beta values)
const SECTOR_BETA: Record<string, { beta: number; volatility: "low" | "medium" | "high"; risk: string }> = {
  BANK: { beta: 1.1, volatility: "medium", risk: "Banking sector has moderate sensitivity to market movements" },
  FNB: { beta: 0.8, volatility: "low", risk: "Consumer staples tend to be defensive stocks" },
  INFRA: { beta: 1.2, volatility: "medium", risk: "Infrastructure stocks react to interest rates and government policy" },
  PROPERTY: { beta: 1.3, volatility: "medium", risk: "Property stocks are sensitive to interest rates" },
  MINING: { beta: 1.6, volatility: "high", risk: "Mining stocks are highly volatile and commodity-dependent" },
  CONSUMER: { beta: 0.9, volatility: "low", risk: "Consumer goods are relatively stable" },
  ENERGY: { beta: 1.4, volatility: "high", risk: "Energy stocks are volatile and oil price dependent" },
  HEALTH: { beta: 0.9, volatility: "medium", risk: "Healthcare is a defensive sector" },
  TECH: { beta: 1.8, volatility: "high", risk: "Technology stocks are highly volatile" },
  OTHER: { beta: 1.0, volatility: "medium", risk: "General sector risk" },
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
  if (upper.includes("GOTO") || upper.includes("BUKA") || upper.includes(" EMT")) return "TECH";
  return "OTHER";
}

export default function RiskMeterPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics[]>([]);
  const [summary, setSummary] = useState<PortfolioRiskSummary | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (portfolio.length > 0) {
      const tickers = portfolio.map((p) => p.ticker);
      getPrices(tickers).then(setPrices);
    }
  }, [portfolio]);

  const calculateRisk = useCallback(() => {
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

  const calculateRisk = () => {
    if (!portfolio.length || !Object.keys(prices).length) return;

    const totalValue = portfolio.reduce((sum, item) => {
      const priceData = prices[item.ticker];
      const currentPrice = priceData?.price || item.avgPrice;
      return sum + item.shares * currentPrice;
    }, 0);

    // Calculate individual stock metrics
    const metrics: RiskMetrics[] = portfolio.map((item) => {
      const priceData = prices[item.ticker];
      const currentPrice = priceData?.price || item.avgPrice;
      const value = item.shares * currentPrice;
      const weight = (value / totalValue) * 100;
      const sector = getSector(item.ticker);
      const sectorInfo = SECTOR_BETA[sector] || SECTOR_BETA.OTHER;

      // Risk score: 1-10 based on beta and weight
      const riskScore = Math.round(sectorInfo.beta * (1 + weight / 100) * 3);

      return {
        ticker: item.ticker,
        name: item.name || item.ticker,
        value,
        weight,
        beta: sectorInfo.beta,
        volatility: sectorInfo.volatility,
        riskScore: Math.min(10, Math.max(1, riskScore)),
      };
    });

    setRiskMetrics(metrics.sort((a, b) => b.weight - a.weight));

    // Calculate weighted beta
    const weightedBeta = metrics.reduce((sum, m) => sum + m.beta * (m.weight / 100), 0);

    // Overall risk score (1-100)
    const overallRisk = Math.round(weightedBeta * 20 + metrics.length * 2);

    // Risk level
    let riskLevel: "low" | "medium" | "high" | "very_high";
    if (overallRisk < 40) riskLevel = "low";
    else if (overallRisk < 60) riskLevel = "medium";
    else if (overallRisk < 80) riskLevel = "high";
    else riskLevel = "very_high";

    // Diversification score (0-100)
    const stockCount = metrics.length;
    const maxWeight = Math.max(...metrics.map((m) => m.weight));
    const diversificationScore = Math.min(100, Math.round(
      (stockCount * 10) + // More stocks = higher score
      ((100 - maxWeight) * 0.5) // Lower concentration = higher score
    ));

    // Concentration risk
    let concentrationRisk = "Well diversified";
    if (maxWeight > 50) concentrationRisk = "High concentration in single stock";
    else if (maxWeight > 30) concentrationRisk = "Moderate concentration risk";
    else if (stockCount < 5) concentrationRisk = "Consider adding more stocks";

    // Generate recommendations
    const recommendations: string[] = [];
    if (maxWeight > 40) {
      recommendations.push(`Reduce ${metrics.find((m) => m.weight === maxWeight)?.ticker} allocation — currently ${maxWeight.toFixed(1)}%`);
    }
    if (stockCount < 5) {
      recommendations.push("Add more stocks to improve diversification");
    }
    if (weightedBeta > 1.3) {
      recommendations.push("Portfolio has high market sensitivity — consider adding defensive stocks");
    }
    if (!metrics.some((m) => m.volatility === "low") && stockCount > 3) {
      recommendations.push("Add some low-volatility stocks for balance");
    }
    if (recommendations.length === 0) {
      recommendations.push("Your portfolio is well-balanced for your current risk level");
    }

    setSummary({
      totalValue,
      weightedBeta,
      overallRisk,
      riskLevel,
      diversificationScore,
      concentrationRisk,
      recommendations,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-400";
      case "medium": return "text-yellow-400";
      case "high": return "text-orange-400";
      case "very_high": return "text-red-400";
      default: return "text-white";
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case "low": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-orange-500";
      case "very_high": return "bg-red-500";
      default: return "bg-white";
    }
  };

  const getVolatilityColor = (vol: string) => {
    switch (vol) {
      case "low": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-red-500";
      default: return "bg-white";
    }
  };

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Portfolio Risk Meter</h1>
        <p className="text-white/50 mt-1">Analyze your portfolio risk and diversification</p>
      </div>

      {/* Risk Gauge */}
      {summary && (
        <GlassCard className="p-6">
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-32 overflow-hidden">
              {/* Semi-circle gauge */}
              <div className="absolute inset-0 rounded-t-full bg-white/10" />
              <div
                className={`absolute bottom-0 left-1/2 w-4 h-32 rounded-full ${getRiskBg(summary.riskLevel)} transition-all duration-1000`}
                style={{
                  transform: `translateX(-50%) rotate(${(summary.overallRisk / 100) * 180 - 90}deg)`,
                  transformOrigin: "bottom center",
                }}
              />
              <div className="absolute bottom-0 left-1/2 w-2 h-24 bg-white rounded-full -translate-x-1/2" />
            </div>
            <div className="mt-4 text-center">
              <p className={`text-3xl font-bold ${getRiskColor(summary.riskLevel)}`}>
                {summary.overallRisk}/100
              </p>
              <p className="text-white/50 text-sm mt-1">
                {summary.riskLevel === "low" && "Low Risk — Conservative Portfolio"}
                {summary.riskLevel === "medium" && "Medium Risk — Balanced Portfolio"}
                {summary.riskLevel === "high" && "High Risk — Growth Portfolio"}
                {summary.riskLevel === "very_high" && "Very High Risk — Speculative Portfolio"}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalValue)}</p>
            <p className="text-white/50 text-sm">Portfolio Value</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className={`text-2xl font-bold ${getRiskColor(summary.riskLevel)}`}>
              {summary.weightedBeta.toFixed(2)}
            </p>
            <p className="text-white/50 text-sm">Portfolio Beta</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className={`text-2xl font-bold ${summary.diversificationScore >= 70 ? "text-green-400" : summary.diversificationScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
              {summary.diversificationScore}%
            </p>
            <p className="text-white/50 text-sm">Diversification</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{riskMetrics.length}</p>
            <p className="text-white/50 text-sm">Stocks Held</p>
          </GlassCard>
        </div>
      )}

      {/* Stock Risk Breakdown */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <GlassCard key={i} className="p-4">
              <Skeleton className="h-16 w-full" />
            </GlassCard>
          ))}
        </div>
      ) : riskMetrics.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No stocks in portfolio</h3>
          <p className="text-white/50 text-sm">Add stocks to see risk analysis</p>
        </GlassCard>
      ) : (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Stock Risk Breakdown</h2>
          <div className="space-y-3">
            {riskMetrics.map((stock) => {
              const sector = getSector(stock.ticker);
              const sectorInfo = SECTOR_BETA[sector] || SECTOR_BETA.OTHER;

              return (
                <div key={stock.ticker} className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getVolatilityColor(stock.volatility)}`} />
                      <div>
                        <p className="text-white font-semibold">{stock.ticker}</p>
                        <p className="text-white/40 text-xs">{stock.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{stock.weight.toFixed(1)}%</p>
                      <p className="text-white/40 text-xs">weight</p>
                    </div>
                  </div>

                  {/* Weight bar */}
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full ${getRiskBg(stock.volatility === "low" ? "low" : stock.volatility === "medium" ? "medium" : "high")}`}
                      style={{ width: `${stock.weight}%` }}
                    />
                  </div>

                  {/* Risk details */}
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-white/40">Beta: </span>
                      <span className={`font-medium ${stock.beta > 1.3 ? "text-red-400" : stock.beta < 0.9 ? "text-green-400" : "text-white/70"}`}>
                        {stock.beta.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40">Volatility: </span>
                      <span className={`font-medium capitalize ${
                        stock.volatility === "low" ? "text-green-400" :
                        stock.volatility === "medium" ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {stock.volatility}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40">Risk: </span>
                      <span className="text-white/70">{(stock.weight / 100 * stock.beta * 10).toFixed(1)}/10</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Recommendations */}
      {summary && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recommendations</h2>
          <div className="space-y-3">
            {summary.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  rec.includes("well-balanced") ? "bg-green-500/20" : "bg-yellow-500/20"
                }`}>
                  <span className={`text-xs font-bold ${rec.includes("well-balanced") ? "text-green-400" : "text-yellow-400"}`}>
                    {rec.includes("well-balanced") ? "✓" : "!"}
                  </span>
                </div>
                <p className="text-white/70 text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Risk Guide */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Understanding Risk Metrics</p>
            <div className="text-white/50 text-sm mt-2 space-y-1">
              <p><span className="text-white">Beta:</span> Measures stock sensitivity to market movements. Beta &gt; 1 = more volatile than market</p>
              <p><span className="text-white">Diversification Score:</span> 70%+ is good. Spread investments across sectors</p>
              <p><span className="text-white">Concentration:</span> No single stock should be more than 20-30% of portfolio</p>
              <p><span className="text-white">Risk Score:</span> Combines beta, weight, and diversification into a single 0-100 score</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </main>
  );
}
