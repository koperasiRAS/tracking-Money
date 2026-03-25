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

interface TargetPlan {
  ticker: string;
  name: string;
  currentShares: number;
  currentPrice: number;
  currentValue: number;
  targetValue: number;
  targetShares: number;
  lotsToBuy: number;
  investmentNeeded: number;
  progressPercent: number;
}

export default function PlannerPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [totalTarget, setTotalTarget] = useState("");

  // Per-stock targets
  const [targets, setTargets] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (portfolio.length > 0) {
      const tickers = portfolio.map((p) => p.ticker);
      getPrices(tickers).then(setPrices);
    }
  }, [portfolio]);

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

  const calculatePlans = (): TargetPlan[] => {
    return portfolio
      .map((item) => {
        const priceData = prices[item.ticker];
        const currentPrice = priceData?.price || item.avgPrice;
        const currentShares = item.shares;
        const currentValue = currentShares * currentPrice;
        const targetValue = parseFloat(targets[item.ticker] || "0") || 0;

        // Lots: 1 lot = 100 shares for Indonesian stocks
        const LOT_SIZE = 100;

        // Calculate lots to buy
        const targetShares = targetValue / currentPrice;
        const currentLotEquivalent = currentShares / LOT_SIZE;
        const targetLotEquivalent = targetShares / LOT_SIZE;
        const lotsToBuy = Math.max(0, Math.ceil(targetLotEquivalent) - Math.floor(currentLotEquivalent));

        // Investment needed
        const sharesToBuy = Math.max(0, targetShares - currentShares);
        const investmentNeeded = sharesToBuy * currentPrice;

        // Progress
        const progressPercent = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

        return {
          ticker: item.ticker,
          name: item.name || item.ticker,
          currentShares,
          currentPrice,
          currentValue,
          targetValue,
          targetShares,
          lotsToBuy,
          investmentNeeded,
          progressPercent,
        };
      })
      .filter((p) => p.targetValue > 0)
      .sort((a, b) => b.progressPercent - a.progressPercent);
  };

  const plans = calculatePlans();

  // Overall stats
  const totalCurrentValue = portfolio.reduce((sum, item) => {
    const priceData = prices[item.ticker];
    const currentPrice = priceData?.price || item.avgPrice;
    return sum + item.shares * currentPrice;
  }, 0);

  const totalTargetValue = Object.values(targets).reduce((sum, t) => sum + (parseFloat(t) || 0), 0);
  const totalInvestmentNeeded = plans.reduce((sum, p) => sum + p.investmentNeeded, 0);
  const overallProgress = totalTargetValue > 0 ? (totalCurrentValue / totalTargetValue) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Suggested targets based on current portfolio
  const suggestedTargets = portfolio.reduce((acc, item) => {
    const priceData = prices[item.ticker];
    const currentPrice = priceData?.price || item.avgPrice;
    const currentValue = item.shares * currentPrice;
    // Default target = 2x current value
    acc[item.ticker] = Math.round(currentValue * 2).toString();
    return acc;
  }, {} as Record<string, string>);

  const applySuggested = () => {
    const newTargets = { ...targets, ...suggestedTargets };
    setTargets(newTargets);
  };

  const clearAll = () => {
    setTargets({});
  };

  // Quick preset multipliers
  const applyMultiplier = (multiplier: number) => {
    const newTargets = portfolio.reduce((acc, item) => {
      const priceData = prices[item.ticker];
      const currentPrice = priceData?.price || item.avgPrice;
      const currentValue = item.shares * currentPrice;
      acc[item.ticker] = Math.round(currentValue * multiplier).toString();
      return acc;
    }, {} as Record<string, string>);
    setTargets(newTargets);
  };

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Target Lot Planner</h1>
          <p className="text-white/50 mt-1">Plan how many lots to reach your target portfolio value</p>
        </div>
      </div>

      {/* Quick Actions */}
      <GlassCard className="p-4">
        <p className="text-white/50 text-sm mb-3">Quick Set Targets</p>
        <div className="flex flex-wrap gap-2">
          <GlassButton variant="secondary" size="sm" onClick={() => applyMultiplier(1.5)}>
            1.5x Current
          </GlassButton>
          <GlassButton variant="secondary" size="sm" onClick={() => applyMultiplier(2)}>
            2x Current
          </GlassButton>
          <GlassButton variant="secondary" size="sm" onClick={() => applyMultiplier(3)}>
            3x Current
          </GlassButton>
          <GlassButton variant="secondary" size="sm" onClick={() => applyMultiplier(5)}>
            5x Current
          </GlassButton>
          <GlassButton variant="ghost" size="sm" onClick={applySuggested}>
            Suggested (2x)
          </GlassButton>
          <GlassButton variant="ghost" size="sm" onClick={clearAll}>
            Clear All
          </GlassButton>
        </div>
      </GlassCard>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{formatCurrency(totalCurrentValue)}</p>
          <p className="text-white/50 text-sm">Current Value</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalTargetValue)}</p>
          <p className="text-white/50 text-sm">Target Value</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalInvestmentNeeded)}</p>
          <p className="text-white/50 text-sm">Investment Needed</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className={`text-2xl font-bold ${overallProgress >= 100 ? "text-green-400" : "text-purple-400"}`}>
            {overallProgress.toFixed(1)}%
          </p>
          <p className="text-white/50 text-sm">Overall Progress</p>
        </GlassCard>
      </div>

      {/* Overall Progress Bar */}
      {totalTargetValue > 0 && (
        <GlassCard className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/70">Portfolio Progress</span>
            <span className="text-white font-medium">{overallProgress.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallProgress >= 100 ? "bg-green-500" : overallProgress >= 50 ? "bg-blue-500" : "bg-purple-500"
              }`}
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-1">
            <span>{formatCurrency(totalCurrentValue)}</span>
            <span>{formatCurrency(totalTargetValue)}</span>
          </div>
        </GlassCard>
      )}

      {/* Target Input Cards */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <GlassCard key={i} className="p-4">
              <Skeleton className="h-32 w-full" />
            </GlassCard>
          ))}
        </div>
      ) : portfolio.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No stocks in portfolio</h3>
          <p className="text-white/50 text-sm">Add stocks to your portfolio first to use the planner</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {portfolio.map((item) => {
            const priceData = prices[item.ticker];
            const currentPrice = priceData?.price || item.avgPrice;
            const currentValue = item.shares * currentPrice;
            const targetValue = parseFloat(targets[item.ticker] || "0") || 0;
            const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
            const lotsNeeded = targetValue > 0
              ? Math.max(0, Math.ceil(targetValue / currentPrice / 100) - Math.floor(item.shares / 100))
              : 0;
            const investmentNeeded = Math.max(0, targetValue - currentValue);

            return (
              <GlassCard key={item.id} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Stock Info */}
                  <div className="flex items-center gap-4 lg:w-40">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 font-bold">{item.ticker.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{item.ticker}</p>
                      <p className="text-white/50 text-xs">{item.shares} lots</p>
                    </div>
                  </div>

                  {/* Current Value */}
                  <div className="lg:w-32 text-center lg:text-left">
                    <p className="text-white/50 text-xs">Current</p>
                    <p className="text-white font-medium">{formatCurrency(currentValue)}</p>
                  </div>

                  {/* Target Input */}
                  <div className="lg:flex-1">
                    <p className="text-white/50 text-xs mb-1">Target Value (IDR)</p>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                      placeholder="e.g. 50000000"
                      value={targets[item.ticker] || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        setTargets((prev) => ({ ...prev, [item.ticker]: value }));
                      }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 lg:gap-8">
                    <div className="text-center">
                      <p className="text-white/50 text-xs">Lots to Buy</p>
                      <p className={`font-bold ${lotsNeeded > 0 ? "text-yellow-400" : "text-green-400"}`}>
                        {targetValue === 0 ? "-" : lotsNeeded}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">Investment</p>
                      <p className="text-white font-medium">
                        {targetValue === 0 ? "-" : formatCurrency(investmentNeeded)}
                      </p>
                    </div>
                    <div className="text-center w-20">
                      <p className="text-white/50 text-xs">Progress</p>
                      <p className={`font-bold ${progress >= 100 ? "text-green-400" : progress >= 50 ? "text-blue-400" : "text-purple-400"}`}>
                        {progress > 0 ? `${Math.min(100, progress).toFixed(0)}%` : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {targetValue > 0 && (
                  <div className="mt-4">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-blue-500" : "bg-purple-500"
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Lot Reference */}
      <GlassCard className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Lot Size Reference</p>
            <p className="text-white/50 text-sm mt-1">
              In Indonesian stock market (IDX), 1 lot = 100 shares. Prices shown are per share.
              When buying, round up to nearest lot (e.g., 150 shares = 2 lots).
            </p>
            <div className="flex gap-4 mt-3 text-sm">
              <div>
                <span className="text-white/50">1 lot = </span>
                <span className="text-white font-medium">100 shares</span>
              </div>
              <div>
                <span className="text-white/50">Min invest = </span>
                <span className="text-white font-medium">1 lot × price</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </main>
  );
}
