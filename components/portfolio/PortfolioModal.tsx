"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import type { PortfolioItem } from "@/types";
import { cn } from "@/lib/utils/cn";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { ticker: string; name: string; shares: number; avgPrice: number }) => Promise<void>;
  item?: PortfolioItem | null;
}

export function PortfolioModal({ isOpen, onClose, onSubmit, item }: PortfolioModalProps) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setTicker(item.ticker);
      setName(item.name || "");
      setShares(item.shares.toString());
      setAvgPrice(item.avgPrice.toString());
    } else {
      setTicker("");
      setName("");
      setShares("");
      setAvgPrice("");
    }
    setError("");
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const sharesNum = parseFloat(shares);
    const priceNum = parseFloat(avgPrice);

    if (!ticker.trim()) {
      setError("Ticker is required");
      return;
    }
    if (isNaN(sharesNum) || sharesNum <= 0) {
      setError("Valid number of shares is required");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Valid average price is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        ticker: ticker.trim(),
        name: name.trim(),
        shares: sharesNum,
        avgPrice: priceNum,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <GlassCard className="relative w-full max-w-md p-6 space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {item ? "Edit Stock" : "Add Stock"}
          </h2>
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
          <GlassInput
            label="Ticker Symbol"
            placeholder="BBCA"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            required
          />
          <GlassInput
            label="Company Name (Optional)"
            placeholder="Bank Central Asia"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <GlassInput
            label="Number of Shares"
            type="number"
            step="0.0001"
            min="0"
            placeholder="100"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            required
          />
          <GlassInput
            label="Average Price (IDR)"
            type="number"
            step="1"
            min="0"
            placeholder="8500"
            value={avgPrice}
            onChange={(e) => setAvgPrice(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-2">
            <GlassButton
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              className="flex-1"
              isLoading={isLoading}
            >
              {item ? "Update" : "Add"}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
