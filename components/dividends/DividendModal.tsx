"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import type { DividendSchedule, DividendFrequency } from "@/types";

interface DividendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    ticker: string;
    name: string;
    annualYieldPercent: number;
    dividendPerShare: number;
    frequency: DividendFrequency;
    nextExDate: string;
    nextPayDate: string;
    notes: string;
  }) => Promise<void>;
  schedule?: DividendSchedule | null;
  portfolioTickers: { ticker: string; name: string | null }[];
}

export function DividendModal({ isOpen, onClose, onSubmit, schedule, portfolioTickers }: DividendModalProps) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [dividendPerShare, setDividendPerShare] = useState("");
  const [frequency, setFrequency] = useState<DividendFrequency>("quarterly");
  const [nextExDate, setNextExDate] = useState("");
  const [nextPayDate, setNextPayDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (schedule) {
      setTicker(schedule.ticker);
      setName(schedule.name || "");
      setDividendPerShare(schedule.dividendPerShare.toString());
      setFrequency(schedule.frequency);
      setNextExDate(schedule.nextExDate || "");
      setNextPayDate(schedule.nextPayDate || "");
      setNotes(schedule.notes || "");
    } else {
      setTicker("");
      setName("");
      setDividendPerShare("");
      setFrequency("quarterly");
      setNextExDate("");
      setNextPayDate("");
      setNotes("");
    }
    setError("");
  }, [schedule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const divPerShare = parseFloat(dividendPerShare);
    if (!ticker.trim()) {
      setError("Ticker is required");
      return;
    }
    if (isNaN(divPerShare) || divPerShare < 0) {
      setError("Valid dividend per share is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        ticker: ticker.trim(),
        name: name.trim(),
        annualYieldPercent: 0, // calculated automatically
        dividendPerShare: divPerShare,
        frequency,
        nextExDate,
        nextPayDate,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save dividend data");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative w-full max-w-md p-6 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {schedule ? "Edit Dividend Data" : "Add Dividend Data"}
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
          <GlassSelect
            label="Ticker (select from portfolio)"
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value);
              const found = portfolioTickers.find((p) => p.ticker === e.target.value);
              if (found && found.name) setName(found.name);
            }}
            options={[
              { value: "", label: "Select a stock..." },
              ...portfolioTickers.map((p) => ({
                value: p.ticker,
                label: `${p.ticker}${p.name ? ` - ${p.name}` : ""}`,
              })),
            ]}
          />
          <GlassInput
            label="Stock Name (Optional)"
            placeholder="Bank Central Asia"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <GlassInput
            label="Dividend Per Share (IDR)"
            type="number"
            step="1"
            min="0"
            placeholder="250"
            value={dividendPerShare}
            onChange={(e) => setDividendPerShare(e.target.value)}
            required
          />
          <GlassSelect
            label="Payment Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as DividendFrequency)}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "quarterly", label: "Quarterly (4x/year)" },
              { value: "semiannual", label: "Semi-Annual (2x/year)" },
              { value: "annual", label: "Annual (1x/year)" },
            ]}
          />
          <GlassInput
            label="Next Ex-Date (Optional)"
            type="date"
            value={nextExDate}
            onChange={(e) => setNextExDate(e.target.value)}
          />
          <GlassInput
            label="Next Pay Date (Optional)"
            type="date"
            value={nextPayDate}
            onChange={(e) => setNextPayDate(e.target.value)}
          />
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-green-400 text-sm">
              💡 Add dividend data for stocks in your Portfolio to see projected income.
              Frequency determines how many times per year dividends are paid.
            </p>
          </div>
          <GlassInput
            label="Notes (Optional)"
            placeholder="Special dividend..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <GlassButton type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" className="flex-1" isLoading={isLoading}>
              {schedule ? "Update" : "Save"}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
