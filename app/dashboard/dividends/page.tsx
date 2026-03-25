"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { DividendModal } from "@/components/dividends/DividendModal";
import { DividendRecordModal } from "@/components/dividends/DividendRecordModal";
import type { DividendSchedule, DividendRecord, DividendForecast, PortfolioItem } from "@/types";
import {
  getDividendSchedules,
  upsertDividendSchedule,
  deleteDividendSchedule,
  getDividendRecords,
  addDividendRecord,
  deleteDividendRecord,
  getPortfolioForDividends,
} from "@/lib/actions/dividends";
import { getPrices } from "@/lib/actions/prices";
import type { PriceData } from "@/types";

const FREQUENCY_MULTIPLIER: Record<string, number> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
};

export default function DividendsPage() {
  const [schedules, setSchedules] = useState<DividendSchedule[]>([]);
  const [records, setRecords] = useState<DividendRecord[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [forecasts, setForecasts] = useState<DividendForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DividendSchedule | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (portfolio.length > 0) {
      const tickers = portfolio.map((p) => p.ticker);
      getPrices(tickers).then(setPrices);
    }
  }, [portfolio]);

  useEffect(() => {
    calculateForecasts();
  }, [schedules, portfolio, prices]);

  const calculateForecasts = () => {
    if (!portfolio.length || !prices) return;

    const forecastMap: Map<string, DividendForecast> = new Map();

    for (const item of portfolio) {
      const schedule = schedules.find((s) => s.ticker === item.ticker);
      const priceData = prices[item.ticker];

      if (!schedule || !priceData) continue;

      const currentPrice = priceData.price;
      const shares = item.shares;
      const dividendPerShare = schedule.dividendPerShare;
      const freqMultiplier = FREQUENCY_MULTIPLIER[schedule.frequency] || 4;

      // Projected income per payment
      const projectedIncome = shares * dividendPerShare;
      // Annualized income
      const annualizedIncome = projectedIncome * freqMultiplier;
      // Yield based on current price
      const yieldPercent = currentPrice > 0 ? (dividendPerShare * freqMultiplier / currentPrice) * 100 : 0;

      forecastMap.set(item.ticker, {
        ticker: item.ticker,
        name: item.name || schedule.name,
        shares,
        avgPrice: item.avgPrice,
        currentPrice,
        annualDividend: dividendPerShare * freqMultiplier,
        dividendPerShare,
        yieldPercent,
        frequency: schedule.frequency,
        nextExDate: schedule.nextExDate,
        nextPayDate: schedule.nextPayDate,
        projectedIncome,
        annualizedIncome,
      });
    }

    setForecasts(Array.from(forecastMap.values()).sort((a, b) => b.annualizedIncome - a.annualizedIncome));
  };

  useEffect(() => {
    calculateForecasts();
  }, [calculateForecasts]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [schedulesData, recordsData, portfolioData] = await Promise.all([
        getDividendSchedules(),
        getDividendRecords(),
        getPortfolioForDividends(),
      ]);
      setSchedules(schedulesData);
      setRecords(recordsData);
      setPortfolio(portfolioData);
    } catch (error) {
      console.error("Failed to load dividend data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSchedule = async (data: {
    ticker: string;
    name: string;
    annualYieldPercent: number;
    dividendPerShare: number;
    frequency: "monthly" | "quarterly" | "semiannual" | "annual";
    nextExDate: string;
    nextPayDate: string;
    notes: string;
  }) => {
    await upsertDividendSchedule(data);
    const updated = await getDividendSchedules();
    setSchedules(updated);
    setIsModalOpen(false);
    setEditingSchedule(null);
  };

  const handleDeleteSchedule = async (id: string) => {
    await deleteDividendSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddRecord = async (data: {
    ticker: string;
    exDate: string;
    payDate: string;
    amountPerShare: number;
    sharesCount: number;
    notes: string;
  }) => {
    const newRecord = await addDividendRecord(data);
    setRecords((prev) => [newRecord, ...prev]);
    setIsRecordModalOpen(false);
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteDividendRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
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
  const totalAnnualIncome = forecasts.reduce((sum, f) => sum + f.annualizedIncome, 0);
  const totalProjectedIncome = forecasts.reduce((sum, f) => sum + f.projectedIncome, 0);
  const thisYearRecords = records.filter((r) => new Date(r.exDate).getFullYear() === new Date().getFullYear());
  const thisYearReceived = thisYearRecords.reduce((sum, r) => sum + (r.totalReceived || 0), 0);

  // Upcoming dividends (next 90 days)
  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const upcoming = forecasts.filter((f) => {
    if (!f.nextExDate) return false;
    const exDate = new Date(f.nextExDate);
    return exDate >= now && exDate <= ninetyDaysLater;
  }).sort((a, b) => {
    if (!a.nextExDate || !b.nextExDate) return 0;
    return new Date(a.nextExDate).getTime() - new Date(b.nextExDate).getTime();
  });

  const freqLabels: Record<string, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    semiannual: "Semi-Annual",
    annual: "Annual",
  };

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dividend Forecast</h1>
          <p className="text-white/50 mt-1">Project your dividend income from holdings</p>
        </div>
        <div className="flex gap-3">
          <GlassButton variant="secondary" onClick={() => setIsRecordModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Log Received
          </GlassButton>
          <GlassButton onClick={() => setIsModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Stock
          </GlassButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAnnualIncome)}</p>
          <p className="text-white/50 text-sm">Est. Annual Income</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{formatCurrency(thisYearReceived)}</p>
          <p className="text-white/50 text-sm">Received This Year</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{upcoming.length}</p>
          <p className="text-white/50 text-sm">Upcoming (90 days)</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{forecasts.length}</p>
          <p className="text-white/50 text-sm">Stocks with Dividends</p>
        </GlassCard>
      </div>

      {/* Info Card */}
      <GlassCard className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">How Dividend Forecasting Works</p>
            <p className="text-white/50 text-sm mt-1">
              Add dividend data for stocks you own in Portfolio. The system will calculate projected income based on your holdings and the dividend schedule.
              Use &quot;Log Received&quot; to record actual dividends you&apos;ve received.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Upcoming Dividends */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Upcoming Dividends</h2>
          <div className="grid gap-3">
            {upcoming.map((f) => (
              <GlassCard key={f.ticker} className="p-4 border-green-500/20 bg-green-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 font-bold">ID</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{f.ticker}</p>
                      <p className="text-white/50 text-sm">
                        {f.nextExDate && `Ex-date: ${new Date(f.nextExDate).toLocaleDateString("id-ID")}`}
                        {f.nextPayDate && ` | Pay: ${new Date(f.nextPayDate).toLocaleDateString("id-ID")}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">{formatCurrency(f.projectedIncome)}</p>
                    <p className="text-white/50 text-xs">{f.shares} lots</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Dividend Forecast Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-4">
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : forecasts.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 8V7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No dividend forecasts yet</h3>
          <p className="text-white/50 text-sm mb-4">
            Add stocks to your Portfolio, then add their dividend data here
          </p>
          <GlassButton onClick={() => setIsModalOpen(true)}>Add First Stock</GlassButton>
        </GlassCard>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Dividend Forecast</h2>
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="p-4 text-white/50 text-sm font-medium">Stock</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Shares</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Div/Share</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Freq</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Yield</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Per Payment</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Annual</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((f) => (
                    <tr key={f.ticker} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <p className="text-white font-medium">{f.ticker}</p>
                        <p className="text-white/50 text-xs">{f.name}</p>
                      </td>
                      <td className="p-4 text-right text-white">{f.shares}</td>
                      <td className="p-4 text-right text-white">{formatCurrency(f.dividendPerShare)}</td>
                      <td className="p-4 text-right text-white/70">{freqLabels[f.frequency] || f.frequency}</td>
                      <td className="p-4 text-right">
                        <span className={`font-medium ${f.yieldPercent >= 4 ? "text-green-400" : f.yieldPercent >= 2 ? "text-yellow-400" : "text-white/50"}`}>
                          {f.yieldPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="p-4 text-right text-green-400 font-medium">{formatCurrency(f.projectedIncome)}</td>
                      <td className="p-4 text-right text-green-400 font-bold">{formatCurrency(f.annualizedIncome)}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const schedule = schedules.find((s) => s.ticker === f.ticker);
                              if (schedule) {
                                setEditingSchedule(schedule);
                                setIsModalOpen(true);
                              }
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </GlassButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td className="p-4 text-white font-bold" colSpan={5}>Total</td>
                    <td className="p-4 text-right text-green-400 font-bold">{formatCurrency(totalProjectedIncome)}</td>
                    <td className="p-4 text-right text-green-400 font-bold">{formatCurrency(totalAnnualIncome)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Dividend Schedules List */}
      {schedules.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Dividend Schedules</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((s) => (
              <GlassCard key={s.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">{s.ticker}</p>
                  <div className="flex gap-1">
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSchedule(s);
                        setIsModalOpen(true);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </GlassButton>
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSchedule(s.id)}
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </GlassButton>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Div/Share</span>
                    <span className="text-white">{formatCurrency(s.dividendPerShare)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Frequency</span>
                    <span className="text-white">{freqLabels[s.frequency] || s.frequency}</span>
                  </div>
                  {s.nextExDate && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Next Ex-Date</span>
                      <span className="text-white">{new Date(s.nextExDate).toLocaleDateString("id-ID")}</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Dividend Records */}
      {records.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Dividend History</h2>
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="p-4 text-white/50 text-sm font-medium">Ticker</th>
                    <th className="p-4 text-white/50 text-sm font-medium">Ex-Date</th>
                    <th className="p-4 text-white/50 text-sm font-medium">Pay-Date</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Per Share</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Total Received</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-medium">{r.ticker}</td>
                      <td className="p-4 text-white/70">{new Date(r.exDate).toLocaleDateString("id-ID")}</td>
                      <td className="p-4 text-white/70">{r.payDate ? new Date(r.payDate).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="p-4 text-right text-white">{formatCurrency(r.amountPerShare)}</td>
                      <td className="p-4 text-right text-green-400 font-medium">
                        {r.totalReceived ? formatCurrency(r.totalReceived) : "-"}
                      </td>
                      <td className="p-4 text-right">
                        <GlassButton variant="ghost" size="sm" onClick={() => handleDeleteRecord(r.id)}>
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </GlassButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Add/Edit Dividend Modal */}
      <DividendModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={handleSaveSchedule}
        schedule={editingSchedule}
        portfolioTickers={portfolio.map((p) => ({ ticker: p.ticker, name: p.name }))}
      />

      {/* Log Received Modal */}
      <DividendRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSubmit={handleAddRecord}
        portfolioTickers={portfolio.map((p) => ({ ticker: p.ticker, name: p.name, shares: p.shares }))}
      />
    </main>
  );
}
