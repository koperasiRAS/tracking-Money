"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import type { Alert } from "@/types";
import { cn } from "@/lib/utils/cn";

interface AlertCardProps {
  alert: Alert;
  currentPrice?: number;
  onEdit: (alert: Alert) => void;
  onDelete: (alert: Alert) => void;
  onToggle: (alert: Alert) => void;
}

export function AlertCard({ alert, currentPrice, onEdit, onDelete, onToggle }: AlertCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isTriggered =
    currentPrice !== undefined &&
    ((alert.condition === "above" && currentPrice >= alert.targetPrice) ||
     (alert.condition === "below" && currentPrice <= alert.targetPrice));

  return (
    <GlassCard
      className={cn(
        "p-4 transition-all duration-300",
        !alert.isActive && "opacity-60",
        isTriggered && "border-green-500/30"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Ticker Badge */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            alert.alertType === "buy" ? "bg-green-500/20" :
            alert.alertType === "avg_down" ? "bg-yellow-500/20" :
            alert.alertType === "warning" ? "bg-red-500/20" :
            (alert.condition === "above" ? "bg-green-500/20" : "bg-red-500/20")
          )}>
            <svg
              className={cn(
                "w-6 h-6",
                alert.alertType === "buy" ? "text-green-600" :
                alert.alertType === "avg_down" ? "text-yellow-400" :
                alert.alertType === "warning" ? "text-red-500" :
                (alert.condition === "above" ? "text-green-600" : "text-red-500")
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {alert.condition === "above" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              )}
            </svg>
          </div>

          {/* Alert Info */}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-gray-900 font-semibold">{alert.ticker}</p>
              {alert.name && (
                <span className="text-gray-500 text-sm">{alert.name}</span>
              )}
              {/* Alert Type Badge */}
              {alert.alertType && alert.alertType !== "default" && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full font-medium",
                  alert.alertType === "buy" && "bg-green-500/20 text-green-600 border border-green-500/30",
                  alert.alertType === "avg_down" && "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
                  alert.alertType === "warning" && "bg-red-500/20 text-red-500 border border-red-500/30",
                )}>
                  {alert.alertType === "buy" && "🟢 BUY"}
                  {alert.alertType === "avg_down" && "🟡 AVG DOWN"}
                  {alert.alertType === "warning" && "🔴 WARNING"}
                </span>
              )}
              {/* Priority indicator */}
              {alert.priority === 1 && (
                <span className="text-red-500 text-xs" title="High Priority">⚡</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className={cn(
                "px-2 py-0.5 text-xs rounded-full",
                alert.condition === "above"
                  ? "bg-green-500/20 text-green-600"
                  : "bg-red-500/20 text-red-500"
              )}>
                {alert.condition === "above" ? "Above" : "Below"} {formatCurrency(alert.targetPrice)}
              </span>
              {alert.lastTriggered && (
                <span className="text-gray-300 text-xs">
                  Triggered {new Date(alert.lastTriggered).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current Price */}
        <div className="text-right mr-4">
          {currentPrice !== undefined ? (
            <div>
              <p className="text-gray-900 font-medium">{formatCurrency(currentPrice)}</p>
              {isTriggered && (
                <span className="text-green-600 text-xs">Triggered!</span>
              )}
            </div>
          ) : (
            <span className="text-gray-300 text-sm">No price data</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onToggle(alert)}
            title={alert.isActive ? "Pause Alert" : "Resume Alert"}
          >
            {alert.isActive ? (
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onEdit(alert)}
            title="Edit Alert"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onDelete(alert)}
            title="Delete Alert"
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
