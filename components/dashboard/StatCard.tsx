"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}: StatCardProps) {
  return (
    <GlassCard className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-white/50 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-white/40 text-xs">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.isPositive ? "text-green-400" : "text-red-400"
            )}>
              <svg
                className={cn("w-4 h-4", !trend.isPositive && "rotate-180")}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
