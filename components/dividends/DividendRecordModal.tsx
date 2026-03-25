"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";

interface DividendRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    ticker: string;
    exDate: string;
    payDate: string;
    amountPerShare: number;
    sharesCount: number;
    notes: string;
  }) => Promise<void>;
  portfolioTickers: { ticker: string; name: string | null; shares: number }[];
}

export function DividendRecordModal({ isOpen, onClose, onSubmit, portfolioTickers }: DividendRecordModalProps) {
  const [ticker, setTicker] = useState("");
  const [exDate, setExDate] = useState("");
  const [payDate, setPayDate] = useState("");
  const [amountPerShare, setAmountPerShare] = useState("");
  const [sharesCount, setSharesCount] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && portfolioTickers.length > 0) {
      setTicker(portfolioTickers[0].ticker);
      setSharesCount(portfolioTickers[0].shares.toString());
    }
  }, [isOpen, portfolioTickers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amt = parseFloat(amountPerShare);
    if (!ticker.trim()) {
      setError("Ticker is required");
      return;
    }
    if (!exDate) {
      setError("Ex-date is required");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setError("Valid amount per share is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        ticker: ticker.trim(),
        exDate,
        payDate,
        amountPerShare: amt,
        sharesCount: parseInt(sharesCount) || 0,
        notes: notes.trim(),
      });
      onClose();
      // Reset
      setAmountPerShare("");
      setExDate("");
      setPayDate("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save record");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalReceived = parseFloat(amountPerShare || "0") * parseInt(sharesCount || "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative w-full max-w-md p-6 space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Log Dividend Received</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassSelect
            label="Ticker"
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value);
              const found = portfolioTickers.find((p) => p.ticker === e.target.value);
              if (found) setSharesCount(found.shares.toString());
            }}
            options={portfolioTickers.map((p) => ({
              value: p.ticker,
              label: `${p.ticker}${p.name ? ` - ${p.name}` : ""} (${p.shares} lots)`,
            }))}
          />
          <GlassInput
            label="Ex-Date"
            type="date"
            value={exDate}
            onChange={(e) => setExDate(e.target.value)}
            required
          />
          <GlassInput
            label="Pay Date (Optional)"
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
          />
          <GlassInput
            label="Dividend Per Share (IDR)"
            type="number"
            step="1"
            min="0"
            placeholder="250"
            value={amountPerShare}
            onChange={(e) => setAmountPerShare(e.target.value)}
            required
          />
          <GlassInput
            label="Number of Shares"
            type="number"
            min="0"
            placeholder="100"
            value={sharesCount}
            onChange={(e) => setSharesCount(e.target.value)}
          />
          {totalReceived > 0 && (
            <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
              <p className="text-green-400 text-sm">
                Estimated total: <span className="font-bold">
                  {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(totalReceived)}
                </span>
              </p>
            </div>
          )}
          <GlassInput
            label="Notes (Optional)"
            placeholder="Regular quarterly dividend..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <GlassButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" className="flex-1" isLoading={isLoading}>
              Log Dividend
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
