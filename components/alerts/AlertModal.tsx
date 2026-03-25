"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import type { Alert } from "@/types";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { ticker: string; name: string; condition: "above" | "below"; targetPrice: number }) => Promise<void>;
  alert?: Alert | null;
  defaultTicker?: string;
  defaultName?: string;
}

export function AlertModal({ isOpen, onClose, onSubmit, alert, defaultTicker, defaultName }: AlertModalProps) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (alert) {
      setTicker(alert.ticker);
      setName(alert.name || "");
      setCondition(alert.condition);
      setTargetPrice(alert.targetPrice.toString());
    } else {
      setTicker(defaultTicker || "");
      setName(defaultName || "");
      setCondition("above");
      setTargetPrice("");
    }
    setError("");
  }, [alert, defaultTicker, defaultName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const price = parseFloat(targetPrice);

    if (!ticker.trim()) {
      setError("Ticker is required");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError("Valid target price is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        ticker: ticker.trim(),
        name: name.trim(),
        condition,
        targetPrice: price,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save alert");
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
            {alert ? "Edit Alert" : "Create Alert"}
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
          <GlassSelect
            label="Alert Condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as "above" | "below")}
            options={[
              { value: "above", label: "Price goes above" },
              { value: "below", label: "Price goes below" },
            ]}
          />
          <GlassInput
            label="Target Price (IDR)"
            type="number"
            step="1"
            min="0"
            placeholder="10000"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
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
              {alert ? "Update" : "Create"}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
