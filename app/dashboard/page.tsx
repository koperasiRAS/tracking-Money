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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Ambil semua data secara paralel
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

      // Ambil harga secara paralel dengan portfolio data
      if (portfolioData.length > 0) {
        const tickers = portfolioData.map((p) => p.ticker);
        const priceData = await getPrices(tickers);
        setPrices(priceData);
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
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
    <main className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 text-sm mt-0.5">Ringkasan investasi Anda</p>
        </div>
        <Link href="/dashboard/portfolio">
          <GlassButton size="sm">+ Tambah Saham</GlassButton>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard className="p-4">
          <p className="text-lg font-bold text-white">{formatCurrency(totalValue)}</p>
          <p className="text-white/40 text-xs mt-0.5">Nilai Portfolio</p>
          <p className={`text-xs mt-1 ${totalGainLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalGainLoss >= 0 ? "+" : ""}{formatCurrency(totalGainLoss)} ({gainLossPercent.toFixed(1)}%)
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-lg font-bold text-blue-400">{portfolio.length}</p>
          <p className="text-white/40 text-xs mt-0.5">Saham</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-lg font-bold text-yellow-400">{activeAlerts}</p>
          <p className="text-white/40 text-xs mt-0.5">Peringatan Aktif</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-lg font-bold text-green-400">{activeDCA}</p>
          <p className="text-white/40 text-xs mt-0.5">Rencana DCA</p>
        </GlassCard>
      </div>

      {/* Feature Overview */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Alat Investasi</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <Link href="/dashboard/alerts">
            <GlassCard className="p-4 cursor-pointer">
              <p className="text-white font-medium text-sm">Peringatan</p>
              <p className="text-yellow-400 text-xs mt-1">{activeAlerts} aktif</p>
            </GlassCard>
          </Link>

          <Link href="/dashboard/dca">
            <GlassCard className="p-4 cursor-pointer">
              <p className="text-white font-medium text-sm">Jadwal DCA</p>
              <p className="text-blue-400 text-xs mt-1">{activeDCA} aktif</p>
            </GlassCard>
          </Link>

          <Link href="/dashboard/dividends">
            <GlassCard className="p-4 cursor-pointer">
              <p className="text-white font-medium text-sm">Dividen</p>
              <p className="text-green-400 text-xs mt-1">{dividendSchedules} dilacak</p>
            </GlassCard>
          </Link>

          <Link href="/dashboard/allocation">
            <GlassCard className="p-4 cursor-pointer">
              <p className="text-white font-medium text-sm">Alokasi</p>
            </GlassCard>
          </Link>
        </div>
      </div>

      {/* Portfolio Holdings */}
      {portfolio.length > 0 && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Holdings Portfolio</h2>
            <Link href="/dashboard/portfolio">
              <GlassButton variant="ghost" size="sm">Lihat Semua</GlassButton>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/40">
                  <th className="pb-2 font-medium">Saham</th>
                  <th className="pb-2 font-medium text-right">Lot</th>
                  <th className="pb-2 font-medium text-right">Harga Rata-rata</th>
                  <th className="pb-2 font-medium text-right">Harga Saat Ini</th>
                  <th className="pb-2 font-medium text-right">Nilai</th>
                  <th className="pb-2 font-medium text-right">Laba/Rugi</th>
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
                      <td className="py-2">
                        <p className="text-white font-medium text-sm">{item.ticker}</p>
                        <p className="text-white/30 text-xs">{item.name || "-"}</p>
                      </td>
                      <td className="py-2 text-right text-white/70 text-sm">{item.shares}</td>
                      <td className="py-2 text-right text-white/70 text-sm">{formatCurrency(item.avgPrice)}</td>
                      <td className="py-2 text-right text-white text-sm">{formatCurrency(currentPrice)}</td>
                      <td className="py-2 text-right text-white font-medium text-sm">{formatCurrency(currentValue)}</td>
                      <td className={`py-2 text-right text-sm font-medium ${gainLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
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
        <GlassCard className="p-8 text-center">
          <h3 className="text-base font-semibold text-white mb-1">Mulai dengan Invest Tracker</h3>
          <p className="text-white/40 text-sm mb-4">
            Tambahkan saham ke portfolio untuk mulai melacak investasi
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/portfolio">
              <GlassButton>Tambah Saham Pertama</GlassButton>
            </Link>
            <Link href="/dashboard/alerts">
              <GlassButton variant="secondary">Buat Peringatan</GlassButton>
            </Link>
          </div>
        </GlassCard>
      )}
    </main>
  );
}
