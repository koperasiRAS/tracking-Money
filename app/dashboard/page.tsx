"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { getPortfolio } from "@/lib/actions/portfolio";
import { getPrices } from "@/lib/actions/prices";
import { getActiveAlerts } from "@/lib/actions/alerts";
import { getActiveDCASchedules } from "@/lib/actions/dca";
import { getDividendSchedules } from "@/lib/actions/dividends";
import type { PortfolioItem } from "@/types";
import type { PriceData } from "@/types";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [activeDCA, setActiveDCA] = useState(0);
  const [dividendSchedules, setDividendSchedules] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [portfolioData, alertsData, dcaData, dividendData] = await Promise.all([
        getPortfolio().catch(() => []),
        getActiveAlerts().catch(() => []),
        getActiveDCASchedules().catch(() => []),
        getDividendSchedules().catch(() => []),
      ]);

      setPortfolio(portfolioData);
      setActiveAlerts(alertsData.length);
      setActiveDCA(dcaData.length);
      setDividendSchedules(dividendData.length);

      if (portfolioData.length > 0) {
        const tickers = portfolioData.map((p) => p.ticker);
        const priceData = await getPrices(tickers);
        setPrices(priceData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate totals
  const totalValue = portfolio.reduce((sum, item) => {
    const priceData = prices[item.ticker];
    const currentPrice = priceData?.price || item.avgPrice;
    return sum + item.shares * currentPrice;
  }, 0);

  const totalCost = portfolio.reduce((sum, item) => sum + item.shares * item.avgPrice, 0);
  const totalGainLoss = totalValue - totalCost;
  const gainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 mt-1">Your investment overview</p>
        </div>
        <div className="flex gap-3">
          <Link href="/portfolio">
            <GlassButton size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Stock
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
          <p className="text-white/50 text-sm">Portfolio Value</p>
          <p className={`text-xs mt-1 ${totalGainLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalGainLoss >= 0 ? "+" : ""}{formatCurrency(totalGainLoss)} ({gainLossPercent.toFixed(1)}%)
          </p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{portfolio.length}</p>
          <p className="text-white/50 text-sm">Stocks</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{activeAlerts}</p>
          <p className="text-white/50 text-sm">Active Alerts</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{activeDCA}</p>
          <p className="text-white/50 text-sm">DCA Plans</p>
        </GlassCard>
      </div>

      {/* Feature Overview */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Smart Investment Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Price Alerts */}
          <Link href="/alerts">
            <GlassCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Price Alerts</p>
                  <p className="text-white/50 text-sm mt-1">
                    Smart alerts: Buy Zone, Avg Down, Warning
                  </p>
                  <p className="text-yellow-400 text-xs mt-2">{activeAlerts} active</p>
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* DCA Scheduler */}
          <Link href="/dca">
            <GlassCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">DCA Scheduler</p>
                  <p className="text-white/50 text-sm mt-1">
                    Recurring investment reminders
                  </p>
                  <p className="text-blue-400 text-xs mt-2">{activeDCA} active</p>
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* Dividends */}
          <Link href="/dividends">
            <GlassCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 8V7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Dividend Forecast</p>
                  <p className="text-white/50 text-sm mt-1">
                    Project your dividend income
                  </p>
                  <p className="text-green-400 text-xs mt-2">{dividendSchedules} tracked</p>
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* Target Planner */}
          <Link href="/planner">
            <GlassCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Target Planner</p>
                  <p className="text-white/50 text-sm mt-1">
                    Plan lots to reach goals
                  </p>
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* Income Planner */}
          <Link href="/income">
            <GlassCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Income Planner</p>
                  <p className="text-white/50 text-sm mt-1">
                    Plan bonus & extra income
                  </p>
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* Allocation */}
          <Link href="/allocation">
            <GlassCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Smart Allocation</p>
                  <p className="text-white/50 text-sm mt-1">
                    Optimize your portfolio mix
                  </p>
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* Risk Meter */}
          <Link href="/risk-meter">
            <GlassCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Risk Meter</p>
                  <p className="text-white/50 text-sm mt-1">
                    Analyze portfolio risk
                  </p>
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* Cash to Lot */}
          <Link href="/cash-to-lot">
            <GlassCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Cash to Lot</p>
                  <p className="text-white/50 text-sm mt-1">
                    Calculate lots from cash
                  </p>
                </div>
              </div>
            </GlassCard>
          </Link>

          {/* Monthly Score */}
          <Link href="/score">
            <GlassCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold">Monthly Score</p>
                  <p className="text-white/50 text-sm mt-1">
                    Track investing performance
                  </p>
                </div>
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>

      {/* Portfolio Holdings */}
      {portfolio.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Portfolio Holdings</h2>
            <Link href="/portfolio">
              <GlassButton variant="ghost" size="sm">View All</GlassButton>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-sm text-white/50">
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium text-right">Shares</th>
                  <th className="pb-3 font-medium text-right">Avg Price</th>
                  <th className="pb-3 font-medium text-right">Current</th>
                  <th className="pb-3 font-medium text-right">Value</th>
                  <th className="pb-3 font-medium text-right">Gain/Loss</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.slice(0, 5).map((item) => {
                  const priceData = prices[item.ticker];
                  const currentPrice = priceData?.price || item.avgPrice;
                  const currentValue = item.shares * currentPrice;
                  const costBasis = item.shares * item.avgPrice;
                  const gainLoss = currentValue - costBasis;
                  const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                  return (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="py-3">
                        <p className="text-white font-medium">{item.ticker}</p>
                        <p className="text-white/40 text-sm">{item.name || "-"}</p>
                      </td>
                      <td className="py-3 text-right text-white">{item.shares}</td>
                      <td className="py-3 text-right text-white/70">{formatCurrency(item.avgPrice)}</td>
                      <td className="py-3 text-right text-white">{formatCurrency(currentPrice)}</td>
                      <td className="py-3 text-right text-white font-medium">{formatCurrency(currentValue)}</td>
                      <td className={`py-3 text-right font-medium ${gainLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {gainLoss >= 0 ? "+" : ""}{gainLossPercent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Empty State */}
      {portfolio.length === 0 && !isLoading && (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Get Started with Invest Tracker Pro</h3>
          <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
            Add stocks to your portfolio to start tracking your investments and unlock all smart tools
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/portfolio">
              <GlassButton>Add Your First Stock</GlassButton>
            </Link>
            <Link href="/alerts">
              <GlassButton variant="secondary">Create an Alert</GlassButton>
            </Link>
          </div>
        </GlassCard>
      )}
    </main>
  );
}
