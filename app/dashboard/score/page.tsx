"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PortfolioItem } from "@/types";
import { getPortfolio } from "@/lib/actions/portfolio";
import { getPrices } from "@/lib/actions/prices";
import type { PriceData } from "@/types";

interface MonthlyScoreData {
  month: string;
  year: number;
  score: number;
  consistencyScore: number;
  diversificationScore: number;
  growthScore: number;
  savingsRate: number;
  totalInvested: number;
  portfolioValue: number;
  gainLoss: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ScorePage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyScores, setMonthlyScores] = useState<MonthlyScoreData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${MONTHS[now.getMonth()]}-${now.getFullYear()}`;
  });

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (portfolio.length > 0) {
      const tickers = portfolio.map((p) => p.ticker);
      getPrices(tickers).then(setPrices);
    }
  }, [portfolio]);

  const calculateScores = useCallback(() => {
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

  const calculateScores = () => {
    if (!portfolio.length) return;

    const totalValue = portfolio.reduce((sum, item) => {
      const priceData = prices[item.ticker];
      const currentPrice = priceData?.price || item.avgPrice;
      return sum + item.shares * currentPrice;
    }, 0);

    const totalCost = portfolio.reduce((sum, item) => {
      return sum + item.shares * item.avgPrice;
    }, 0);

    const gainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    // Diversification score (0-100)
    const stockCount = portfolio.length;
    const diversificationScore = Math.min(100, stockCount * 15);

    // Consistency score (simplified - based on having regular investments)
    // In real app, this would track actual monthly investments
    const consistencyScore = Math.min(100, stockCount * 20);

    // Growth score (based on gain/loss percentage)
    // Score: 50 baseline + up to 50 for positive gains
    let growthScore = 50;
    if (gainLossPercent > 0) {
      growthScore = Math.min(100, 50 + gainLossPercent * 5);
    } else {
      growthScore = Math.max(0, 50 + gainLossPercent * 5);
    }

    // Overall score (weighted average)
    const overallScore = Math.round(
      (consistencyScore * 0.3) +
      (diversificationScore * 0.3) +
      (growthScore * 0.4)
    );

    // Mock monthly scores for the past 6 months
    const now = new Date();
    const scores: MonthlyScoreData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = MONTHS[date.getMonth()];
      const year = date.getFullYear();
      const key = `${monthName}-${year}`;

      // Simulate scores (in real app, this would be stored in database)
      const variance = Math.random() * 20 - 10;
      const monthScore = Math.max(30, Math.min(100, overallScore + variance));

      scores.push({
        month: monthName,
        year,
        score: Math.round(monthScore),
        consistencyScore: Math.round(monthScore * 0.9 + Math.random() * 10),
        diversificationScore: Math.round(diversificationScore + Math.random() * 15 - 7.5),
        growthScore: Math.round(monthScore * 1.1 + Math.random() * 10 - 5),
        savingsRate: Math.round(10 + Math.random() * 20),
        totalInvested: totalCost * (1 - i * 0.1),
        portfolioValue: totalValue * (1 - i * 0.05),
        gainLoss: gainLoss * (1 - i * 0.2),
      });
    }

    setMonthlyScores(scores);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "text-green-400" };
    if (score >= 80) return { grade: "A", color: "text-green-400" };
    if (score >= 70) return { grade: "B+", color: "text-blue-400" };
    if (score >= 60) return { grade: "B", color: "text-blue-400" };
    if (score >= 50) return { grade: "C+", color: "text-yellow-400" };
    if (score >= 40) return { grade: "C", color: "text-yellow-400" };
    if (score >= 30) return { grade: "D", color: "text-orange-400" };
    return { grade: "F", color: "text-red-400" };
  };

  const currentScore = monthlyScores[monthlyScores.length - 1];
  const grade = currentScore ? getGrade(currentScore.score) : getGrade(0);
  const prevScore = monthlyScores[monthlyScores.length - 2];

  // Calculate totals
  const totalValue = portfolio.reduce((sum, item) => {
    const priceData = prices[item.ticker];
    const currentPrice = priceData?.price || item.avgPrice;
    return sum + item.shares * currentPrice;
  }, 0);

  const totalCost = portfolio.reduce((sum, item) => sum + item.shares * item.avgPrice, 0);
  const gainLoss = totalValue - totalCost;

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Monthly Investment Score</h1>
        <p className="text-white/50 mt-1">Track your investing performance and consistency</p>
      </div>

      {/* Current Month Score */}
      {currentScore && (
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Score Card */}
          <GlassCard className="p-6 flex flex-col items-center">
            <p className="text-white/50 text-sm mb-2">{currentScore.month} {currentScore.year}</p>
            <div className="relative w-48 h-48">
              {/* Score circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke={currentScore.score >= 80 ? "#4ade80" : currentScore.score >= 60 ? "#60a5fa" : currentScore.score >= 40 ? "#fbbf24" : "#f87171"}
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(currentScore.score / 100) * 553} 553`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-6xl font-bold ${getScoreColor(currentScore.score)}`}>
                  {currentScore.score}
                </span>
                <span className={`text-2xl font-bold ${grade.color}`}>
                  {grade.grade}
                </span>
              </div>
            </div>
            <p className={`text-lg font-semibold mt-4 ${getScoreColor(currentScore.score)}`}>
              {currentScore.score >= 80 ? "Excellent!" :
               currentScore.score >= 60 ? "Good Job!" :
               currentScore.score >= 40 ? "Keep Improving!" : "Needs Work"}
            </p>
            {prevScore && (
              <p className="text-white/50 text-sm mt-1">
                {currentScore.score > prevScore.score ? "↑" : currentScore.score < prevScore.score ? "↓" : "→"}
                {Math.abs(currentScore.score - prevScore.score)} from last month
              </p>
            )}
          </GlassCard>

          {/* Score Breakdown */}
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Score Breakdown</h2>
            <div className="space-y-4">
              {[
                { label: "Consistency", score: currentScore.consistencyScore, weight: "30%" },
                { label: "Diversification", score: currentScore.diversificationScore, weight: "30%" },
                { label: "Growth", score: currentScore.growthScore, weight: "40%" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{item.label}</span>
                    <span className={`font-medium ${getScoreColor(item.score)}`}>
                      {item.score}/100 ({item.weight})
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreBg(item.score)} transition-all duration-500`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
          <p className="text-white/50 text-sm">Portfolio Value</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-white">{formatCurrency(totalCost)}</p>
          <p className="text-white/50 text-sm">Total Invested</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className={`text-2xl font-bold ${gainLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
            {gainLoss >= 0 ? "+" : ""}{formatCurrency(gainLoss)}
          </p>
          <p className="text-white/50 text-sm">Total Gain/Loss</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className={`text-2xl font-bold ${totalCost > 0 ? (gainLoss / totalCost * 100 >= 0 ? "text-green-400" : "text-red-400") : "text-white/50"}`}>
            {totalCost > 0 ? `${(gainLoss / totalCost * 100).toFixed(1)}%` : "0%"}
          </p>
          <p className="text-white/50 text-sm">Return %</p>
        </GlassCard>
      </div>

      {/* Score History */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Score History (Last 6 Months)</h2>
        <div className="space-y-3">
          {monthlyScores.map((score, i) => (
            <div key={`${score.month}-${score.year}`} className="flex items-center gap-4">
              <div className="w-24 text-white/70 text-sm">
                {score.month} {score.year}
              </div>
              <div className="flex-1">
                <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBg(score.score)} transition-all duration-500`}
                    style={{ width: `${score.score}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right">
                <span className={`font-bold ${getScoreColor(score.score)}`}>{score.score}</span>
              </div>
              <div className="w-10 text-right">
                <span className={`text-sm font-bold ${getGrade(score.score).color}`}>
                  {getGrade(score.score).grade}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Tips to Improve */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Tips to Improve Your Score</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-lg">📊</span>
              </div>
              <p className="text-white font-medium">Diversification</p>
            </div>
            <p className="text-white/50 text-sm">
              {portfolio.length < 5
                ? `Add ${5 - portfolio.length} more stocks to improve diversification score`
                : "Your portfolio is well diversified!"}
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-lg">📅</span>
              </div>
              <p className="text-white font-medium">Consistency</p>
            </div>
            <p className="text-white/50 text-sm">
              Invest regularly using DCA to improve your consistency score
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-400 text-lg">💰</span>
              </div>
              <p className="text-white font-medium">Savings Rate</p>
            </div>
            <p className="text-white/50 text-sm">
              Try to invest at least 10-20% of your income monthly
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 text-lg">📈</span>
              </div>
              <p className="text-white font-medium">Long Term Focus</p>
            </div>
            <p className="text-white/50 text-sm">
              Stay invested and avoid emotional decisions based on short-term volatility
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Grading Scale */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Grading Scale</p>
            <div className="text-white/50 text-sm mt-2 space-y-1">
              <p><span className="text-green-400 font-medium">A+ / A (80-100):</span> Excellent investor — diversified, consistent, growing</p>
              <p><span className="text-blue-400 font-medium">B+ / B (60-79):</span> Good investor — on track with room to improve</p>
              <p><span className="text-yellow-400 font-medium">C+ / C (40-59):</span> Average investor — needs more consistency and diversification</p>
              <p><span className="text-orange-400 font-medium">D (30-39):</span> Below average — focus on basics: invest regularly</p>
              <p><span className="text-red-400 font-medium">F (&lt;30):</span> Needs improvement — start with small regular investments</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </main>
  );
}
