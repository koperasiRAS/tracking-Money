"use client";

import { cn } from "@/lib/utils/cn";

interface PriceDisplayProps {
  price: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({ price, currency = "IDR", size = "md", className }: PriceDisplayProps) {
  const formatCurrency = (value: number, curr: string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: curr === "IDR" ? 0 : 2,
    }).format(value);
  };

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <span className={cn("font-semibold text-gray-900", sizes[size], className)}>
      {formatCurrency(price, currency)}
    </span>
  );
}

interface PriceChangeProps {
  change: number;
  changePercent: number;
  showCurrency?: boolean;
  className?: string;
}

export function PriceChange({ change, changePercent, showCurrency = false, className }: PriceChangeProps) {
  const isPositive = change >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      signDisplay: "exceptZero",
    }).format(value);
  };

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm font-medium",
      isPositive ? "text-green-600" : "text-red-500",
      className
    )}>
      {isPositive ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      <span>
        {showCurrency ? formatCurrency(change) : (isPositive ? "+" : "")}{change.toFixed(2)} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
      </span>
    </div>
  );
}
