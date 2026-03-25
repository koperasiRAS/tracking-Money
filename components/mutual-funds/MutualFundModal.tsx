"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import type { MutualFund } from "@/types";

interface MutualFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { fundName: string; ticker: string; units: number; nav: number; purchaseDate: string }) => Promise<void>;
  fund?: MutualFund | null;
  isNAVUpdate?: boolean;
}

export function MutualFundModal({
  isOpen,
  onClose,
  onSubmit,
  fund,
  isNAVUpdate = false,
}: MutualFundModalProps) {
  const [fundName, setFundName] = useState("");
  const [ticker, setTicker] = useState("");
  const [units, setUnits] = useState("");
  const [nav, setNav] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNAVUpdate && fund) {
      // NAV update mode - just show NAV field
      setFundName(fund.fundName);
      setTicker(fund.ticker || "");
      setUnits(fund.units.toString());
      setNav("");
      setPurchaseDate(fund.purchaseDate || "");
    } else if (fund) {
      setFundName(fund.fundName);
      setTicker(fund.ticker || "");
      setUnits(fund.units.toString());
      setNav(fund.nav.toString());
      setPurchaseDate(fund.purchaseDate || "");
    } else {
      setFundName("");
      setTicker("");
      setUnits("");
      setNav("");
      setPurchaseDate("");
    }
    setError("");
  }, [fund, isNAVUpdate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const unitsNum = parseFloat(units);
    const navNum = parseFloat(nav);

    if (!fundName.trim()) {
      setError("Fund name is required");
      return;
    }
    if (!isNAVUpdate && (isNaN(unitsNum) || unitsNum <= 0)) {
      setError("Valid number of units is required");
      return;
    }
    if (isNaN(navNum) || navNum <= 0) {
      setError("Valid NAV is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        fundName: fundName.trim(),
        ticker: ticker.trim(),
        units: unitsNum,
        nav: navNum,
        purchaseDate: purchaseDate,
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <GlassCard className="relative w-full max-w-md p-6 space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {isNAVUpdate ? "Update NAV" : fund ? "Edit Fund" : "Add Mutual Fund"}
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
          {!isNAVUpdate && (
            <>
              <GlassInput
                label="Fund Name"
                placeholder="BCA Dana Saham"
                value={fundName}
                onChange={(e) => setFundName(e.target.value)}
                required
              />
              <GlassInput
                label="Ticker (Optional)"
                placeholder="MIDF"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
              />
              <GlassInput
                label="Number of Units"
                type="number"
                step="0.0001"
                min="0"
                placeholder="1000"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                required
              />
              <GlassInput
                label="Purchase Date (Optional)"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </>
          )}
          <GlassInput
            label={isNAVUpdate ? "New NAV" : "Current NAV (IDR)"}
            type="number"
            step="1"
            min="0"
            placeholder="5000"
            value={nav}
            onChange={(e) => setNav(e.target.value)}
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
              {isNAVUpdate ? "Update NAV" : fund ? "Update" : "Add"}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
