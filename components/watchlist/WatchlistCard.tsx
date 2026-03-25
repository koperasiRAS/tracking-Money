"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import type { WatchlistItem } from "@/types";
import { cn } from "@/lib/utils/cn";

interface WatchlistCardProps {
  item: WatchlistItem;
  price?: number;
  change?: number;
  changePercent?: number;
  onEdit: (item: WatchlistItem) => void;
  onRemove: (item: WatchlistItem) => void;
  onAddAlert?: (item: WatchlistItem) => void;
}

export function WatchlistCard({
  item,
  price,
  change,
  changePercent,
  onEdit,
  onRemove,
  onAddAlert,
}: WatchlistCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isPositive = change !== undefined ? change >= 0 : true;

  return (
    <GlassCard className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Ticker Badge */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <span className="text-green-600 font-bold text-sm">
              {item.ticker.slice(0, 2)}
            </span>
          </div>

          {/* Stock Info */}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 dark:text-gray-100 font-semibold">{item.ticker}</p>
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-600">
                {item.type === "stock" ? "Stock" : "Fund"}
              </span>
            </div>
            {item.name && (
              <p className="text-gray-500 dark:text-gray-400 text-sm">{item.name}</p>
            )}
          </div>
        </div>

        {/* Price Info */}
        <div className="text-right">
          {price !== undefined ? (
            <>
              <p className="text-gray-900 dark:text-gray-100 font-semibold">{formatCurrency(price)}</p>
              <div className={cn(
                "flex items-center justify-end gap-1 text-sm",
                isPositive ? "text-green-600" : "text-red-500"
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
                  {isPositive ? "+" : ""}{change?.toFixed(2)} ({changePercent?.toFixed(2)}%)
                </span>
              </div>
            </>
          ) : (
            <p className="text-gray-300 dark:text-gray-600 text-sm">Loading...</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {onAddAlert && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => onAddAlert(item)}
              title="Create Alert"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </GlassButton>
          )}
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item)}
            title="Remove from Watchlist"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}
