"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";

const LOT_SIZE = 100;

interface CalculationResult {
  ticker: string;
  price: number;
  cashAmount: number;
  lots: number;
  shares: number;
  remainingCash: number;
  totalCost: number;
}

export default function CashToLotPage() {
  const [inputMode, setInputMode] = useState<"cash" | "lots">("cash");
  const [ticker, setTicker] = useState("");
  const [price, setPrice] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [targetLots, setTargetLots] = useState("");
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");

    const priceNum = parseFloat(price);
    if (!ticker.trim()) {
      setError("Ticker is required");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Valid price is required");
      return;
    }

    let result: CalculationResult;

    if (inputMode === "cash") {
      const cash = parseFloat(cashAmount);
      if (isNaN(cash) || cash < LOT_SIZE * priceNum) {
        setError(`Minimum investment is ${LOT_SIZE} lots × price = ${formatCurrency(LOT_SIZE * priceNum)}`);
        return;
      }

      const maxShares = Math.floor(cash / priceNum);
      const lots = Math.floor(maxShares / LOT_SIZE);
      const shares = lots * LOT_SIZE;
      const totalCost = shares * priceNum;
      const remainingCash = cash - totalCost;

      result = {
        ticker: ticker.toUpperCase(),
        price: priceNum,
        cashAmount: cash,
        lots,
        shares,
        remainingCash,
        totalCost,
      };
    } else {
      const lotsNum = parseInt(targetLots);
      if (isNaN(lotsNum) || lotsNum <= 0) {
        setError("Valid number of lots is required");
        return;
      }

      const shares = lotsNum * LOT_SIZE;
      const totalCost = shares * priceNum;

      result = {
        ticker: ticker.toUpperCase(),
        price: priceNum,
        cashAmount: totalCost,
        lots: lotsNum,
        shares,
        remainingCash: 0,
        totalCost,
      };
    }

    setResults((prev) => {
      const existing = prev.findIndex((r) => r.ticker === result.ticker);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });

    // Reset form
    setTicker("");
    setPrice("");
    setCashAmount("");
    setTargetLots("");
  };

  const removeResult = (tickerToRemove: string) => {
    setResults((prev) => prev.filter((r) => r.ticker !== tickerToRemove));
  };

  const clearAll = () => {
    setResults([]);
  };

  const totalInvestment = results.reduce((sum, r) => sum + r.totalCost, 0);
  const totalLots = results.reduce((sum, r) => sum + r.lots, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Cash to Lot Calculator</h1>
        <p className="text-white/50 mt-1">Calculate how many lots you can buy with your cash</p>
      </div>

      {/* Calculator Input */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Calculate</h2>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setInputMode("cash")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              inputMode === "cash"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            I have IDR...
          </button>
          <button
            onClick={() => setInputMode("lots")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              inputMode === "lots"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            I want X lots
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <GlassInput
            label="Ticker Symbol"
            placeholder="BBCA"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
          />
          <GlassInput
            label="Current Price (IDR)"
            type="number"
            step="1"
            min="0"
            placeholder="8500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          {inputMode === "cash" ? (
            <GlassInput
              label={`Cash Available (IDR)`}
              type="number"
              step="1000"
              min="0"
              placeholder="10000000"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
            />
          ) : (
            <GlassInput
              label="Target Lots"
              type="number"
              min="1"
              placeholder="10"
              value={targetLots}
              onChange={(e) => setTargetLots(e.target.value)}
            />
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <GlassButton onClick={calculate} className="flex-1">
            Calculate
          </GlassButton>
          <GlassButton variant="secondary" onClick={clearAll}>
            Clear All
          </GlassButton>
        </div>
      </GlassCard>

      {/* Lot Reference */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">IDX Lot Size</p>
            <p className="text-white/50 text-sm">
              1 Lot = {LOT_SIZE} shares (Indonesian Stock Exchange standard)
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{results.length}</p>
            <p className="text-white/50 text-sm">Stocks</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{totalLots}</p>
            <p className="text-white/50 text-sm">Total Lots</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{formatCurrency(totalInvestment)}</p>
            <p className="text-white/50 text-sm">Total Investment</p>
          </GlassCard>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Calculation Results</h2>
          <div className="grid gap-4">
            {results.map((result) => (
              <GlassCard key={result.ticker} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Ticker */}
                  <div className="flex items-center gap-4 lg:w-32">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-lg">{result.ticker.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{result.ticker}</p>
                      <p className="text-white/50 text-xs">@ {formatCurrency(result.price)}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-white/50 text-xs">Lots</p>
                      <p className="text-2xl font-bold text-blue-400">{result.lots}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">Shares</p>
                      <p className="text-xl font-bold text-white">{result.shares.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">Total Cost</p>
                      <p className="text-xl font-bold text-green-400">{formatCurrency(result.totalCost)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">Remaining</p>
                      <p className={`text-xl font-bold ${result.remainingCash > 0 ? "text-yellow-400" : "text-white/30"}`}>
                        {formatCurrency(result.remainingCash)}
                      </p>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeResult(result.ticker)}
                    className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Investment Tips</p>
            <div className="text-white/50 text-sm mt-2 space-y-1">
              <p>• Always round down lots — you can&apos;t buy fractional lots on IDX</p>
              <p>• Keep some cash for transaction fees (~0.15-0.30%)</p>
              <p>• &quot;Remaining&quot; shows unused cash after buying full lots</p>
              <p>• For DCA, consider how many full lots you can buy regularly</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </main>
  );
}
