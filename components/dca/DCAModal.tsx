"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import type { DCASchedule, DCAFrequency } from "@/types";

interface DCAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    ticker: string;
    name: string;
    amount: number;
    frequency: DCAFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    notes?: string;
  }) => Promise<void>;
  schedule?: DCASchedule | null;
}

const WEEKDAYS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}`,
}));

export function DCAModal({ isOpen, onClose, onSubmit, schedule }: DCAModalProps) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<DCAFrequency>("monthly");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (schedule) {
      setTicker(schedule.ticker);
      setName(schedule.name || "");
      setAmount(schedule.amount.toString());
      setFrequency(schedule.frequency);
      setDayOfWeek((schedule.dayOfWeek ?? 1).toString());
      setDayOfMonth((schedule.dayOfMonth ?? 1).toString());
      setNotes(schedule.notes || "");
    } else {
      setTicker("");
      setName("");
      setAmount("");
      setFrequency("monthly");
      setDayOfWeek("1");
      setDayOfMonth("1");
      setNotes("");
    }
    setError("");
  }, [schedule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amountNum = parseFloat(amount);

    if (!ticker.trim()) {
      setError("Ticker is required");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Valid amount is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        ticker: ticker.trim(),
        name: name.trim(),
        amount: amountNum,
        frequency,
        dayOfWeek: frequency === "weekly" || frequency === "biweekly" ? parseInt(dayOfWeek) : undefined,
        dayOfMonth: frequency === "monthly" || frequency === "quarterly" ? parseInt(dayOfMonth) : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save DCA plan");
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
      <GlassCard className="relative w-full max-w-md p-6 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {schedule ? "Edit DCA Plan" : "Create DCA Plan"}
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
            placeholder="BBRI"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            required
          />
          <GlassInput
            label="Stock/Fund Name (Optional)"
            placeholder="Bank BRI"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <GlassInput
            label="Amount per Session (IDR)"
            type="number"
            step="1000"
            min="10000"
            placeholder="1000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <GlassSelect
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as DCAFrequency)}
            options={[
              { value: "weekly", label: "📅 Weekly — Every week" },
              { value: "biweekly", label: "📅 Bi-weekly — Every 2 weeks" },
              { value: "monthly", label: "📅 Monthly — Every month" },
              { value: "quarterly", label: "📅 Quarterly — Every 3 months" },
            ]}
          />

          {(frequency === "weekly" || frequency === "biweekly") && (
            <GlassSelect
              label="Day of Week"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              options={WEEKDAYS}
            />
          )}

          {(frequency === "monthly" || frequency === "quarterly") && (
            <GlassSelect
              label="Day of Month"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              options={MONTH_DAYS}
            />
          )}

          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-green-400 text-sm">
              💡 You&apos;ll receive a Telegram reminder when your DCA is due.
              The schedule will automatically advance to the next period after being triggered.
            </p>
          </div>

          <GlassInput
            label="Notes (Optional)"
            placeholder="Emergency fund buffer..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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
              {schedule ? "Update" : "Create"}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
