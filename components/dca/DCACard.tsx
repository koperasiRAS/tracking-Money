"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import type { DCASchedule } from "@/types";
import { cn } from "@/lib/utils/cn";

interface DCACardProps {
  schedule: DCASchedule;
  onEdit: (schedule: DCASchedule) => void;
  onDelete: (schedule: DCASchedule) => void;
  onToggle: (schedule: DCASchedule) => void;
  highlight?: boolean;
}

const frequencyLabels: Record<string, { label: string; icon: string }> = {
  weekly: { label: "Weekly", icon: "M" },
  biweekly: { label: "Bi-weekly", icon: "2M" },
  monthly: { label: "Monthly", icon: "Q" },
  quarterly: { label: "Quarterly", icon: "3M" },
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DCACard({ schedule, onEdit, onDelete, onToggle, highlight }: DCACardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const nextDueDate = new Date(schedule.nextDue);
  const now = new Date();
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const getDueLabel = () => {
    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue === 0) return "Today";
    if (daysUntilDue === 1) return "Tomorrow";
    if (daysUntilDue <= 7) return `In ${daysUntilDue} days`;
    return nextDueDate.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
  };

  const getDueColor = () => {
    if (daysUntilDue < 0) return "text-red-400";
    if (daysUntilDue === 0) return "text-yellow-400";
    if (daysUntilDue <= 3) return "text-orange-400";
    return "text-white/50";
  };

  const freq = frequencyLabels[schedule.frequency] || { label: schedule.frequency, icon: "?" };

  return (
    <GlassCard
      className={cn(
        "p-4 transition-all duration-300",
        !schedule.isActive && "opacity-60",
        highlight && daysUntilDue <= 3 && "border-orange-500/30 bg-orange-500/5"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Ticker Badge */}
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex flex-col items-center justify-center">
            <span className="text-green-400 font-bold text-sm">{freq.icon}</span>
            <span className="text-green-400/60 text-xs">{freq.label.split("-")[0]}</span>
          </div>

          {/* Schedule Info */}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold">{schedule.ticker}</p>
              {schedule.name && (
                <span className="text-white/50 text-sm">{schedule.name}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-white font-medium">
                {formatCurrency(schedule.amount)}
              </span>
              <span className="text-white/30 text-sm">•</span>
              <span className="text-white/50 text-sm">{freq.label}</span>
              {schedule.dayOfWeek !== null && schedule.dayOfWeek !== undefined && (
                <>
                  <span className="text-white/30 text-sm">•</span>
                  <span className="text-white/50 text-sm">{dayNames[schedule.dayOfWeek]}</span>
                </>
              )}
              {schedule.dayOfMonth !== null && schedule.dayOfMonth !== undefined && (
                <>
                  <span className="text-white/30 text-sm">•</span>
                  <span className="text-white/50 text-sm">Day {schedule.dayOfMonth}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Due Date */}
        <div className="text-right mr-4">
          <p className={cn("text-sm font-medium", getDueColor())}>
            {getDueLabel()}
          </p>
          {schedule.lastTriggered && (
            <p className="text-white/30 text-xs mt-1">
              Last: {new Date(schedule.lastTriggered).toLocaleDateString("id-ID")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onToggle(schedule)}
            title={schedule.isActive ? "Pause Plan" : "Resume Plan"}
          >
            {schedule.isActive ? (
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onEdit(schedule)}
            title="Edit Plan"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onDelete(schedule)}
            title="Delete Plan"
          >
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}
