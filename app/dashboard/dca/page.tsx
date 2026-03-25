"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { DCAModal } from "@/components/dca/DCAModal";
import { DCACard } from "@/components/dca/DCACard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { DCASchedule } from "@/types";
import {
  getDCASchedules,
  createDCASchedule,
  updateDCASchedule,
  deleteDCASchedule,
} from "@/lib/actions/dca";

export default function DCAPage() {
  const [schedules, setSchedules] = useState<DCASchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<DCASchedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<DCASchedule | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await getDCASchedules();
      setSchedules(data);
    } catch (error) {
      console.error("Failed to load DCA schedules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSchedule = async (data: {
    ticker: string;
    name: string;
    amount: number;
    frequency: "weekly" | "biweekly" | "monthly" | "quarterly";
    dayOfWeek?: number;
    dayOfMonth?: number;
    notes?: string;
  }) => {
    const newSchedule = await createDCASchedule(data);
    setSchedules((prev) => [...prev, newSchedule]);
  };

  const handleEditSchedule = async (data: {
    ticker: string;
    name: string;
    amount: number;
    frequency: "weekly" | "biweekly" | "monthly" | "quarterly";
    dayOfWeek?: number;
    dayOfMonth?: number;
    notes?: string;
  }) => {
    if (!editingSchedule) return;
    const updated = await updateDCASchedule(editingSchedule.id, data);
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditingSchedule(null);
  };

  const handleToggleSchedule = async (schedule: DCASchedule) => {
    const updated = await updateDCASchedule(schedule.id, { isActive: !schedule.isActive });
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteSchedule = async () => {
    if (!deletingSchedule) return;
    await deleteDCASchedule(deletingSchedule.id);
    setSchedules((prev) => prev.filter((s) => s.id !== deletingSchedule.id));
    setDeletingSchedule(null);
  };

  const activeSchedules = schedules.filter((s) => s.isActive);
  const pausedSchedules = schedules.filter((s) => !s.isActive);

  // Calculate upcoming schedules (next 7 days)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingSchedules = activeSchedules.filter((s) => {
    const dueDate = new Date(s.nextDue);
    return dueDate <= nextWeek;
  });

  // Calculate monthly total
  const monthlyTotal = activeSchedules.reduce((sum, s) => {
    const monthlyAmount =
      s.frequency === "weekly" ? s.amount * 4 :
      s.frequency === "biweekly" ? s.amount * 2 :
      s.frequency === "monthly" ? s.amount :
      s.frequency === "quarterly" ? s.amount / 3 : s.amount;
    return sum + monthlyAmount;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DCA Scheduler</h1>
          <p className="text-gray-500 mt-1">Set up recurring investment reminders</p>
        </div>
        <GlassButton onClick={() => setIsModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add DCA Plan
        </GlassButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{activeSchedules.length}</p>
          <p className="text-gray-500 text-sm">Active Plans</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{upcomingSchedules.length}</p>
          <p className="text-gray-500 text-sm">Due This Week</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyTotal)}</p>
          <p className="text-gray-500 text-sm">Est. Monthly</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{pausedSchedules.length}</p>
          <p className="text-gray-500 text-sm">Paused</p>
        </GlassCard>
      </div>

      {/* Info Card */}
      <GlassCard className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-900 font-medium">How DCA Works</p>
            <p className="text-gray-500 text-sm mt-1">
              Dollar Cost Averaging (DCA) helps you invest consistently by buying fixed amounts at regular intervals.
              Set up your schedule and get reminded on Telegram when it&apos;s time to invest.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Upcoming This Week */}
      {upcomingSchedules.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Due This Week</h2>
          <div className="grid gap-3">
            {upcomingSchedules.map((schedule) => (
              <DCACard
                key={schedule.id}
                schedule={schedule}
                onEdit={(s) => setEditingSchedule(s)}
                onDelete={(s) => setDeletingSchedule(s)}
                onToggle={handleToggleSchedule}
                highlight
              />
            ))}
          </div>
        </div>
      )}

      {/* All Schedules */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No DCA plans yet</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first recurring investment plan</p>
          <GlassButton onClick={() => setIsModalOpen(true)}>Create Your First Plan</GlassButton>
        </GlassCard>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Plans</h2>
          <div className="grid gap-3">
            {schedules.map((schedule) => (
              <DCACard
                key={schedule.id}
                schedule={schedule}
                onEdit={(s) => setEditingSchedule(s)}
                onDelete={(s) => setDeletingSchedule(s)}
                onToggle={handleToggleSchedule}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <DCAModal
        isOpen={isModalOpen || !!editingSchedule}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={editingSchedule ? handleEditSchedule : handleCreateSchedule}
        schedule={editingSchedule}
      />

      {/* Delete Confirmation */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingSchedule(null)} />
          <GlassCard className="relative w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900">Delete DCA Plan</h3>
            <p className="text-gray-500">
              Are you sure you want to delete this DCA plan for {deletingSchedule.ticker}?
            </p>
            <div className="flex gap-3">
              <GlassButton variant="secondary" className="flex-1" onClick={() => setDeletingSchedule(null)}>
                Cancel
              </GlassButton>
              <GlassButton variant="danger" className="flex-1" onClick={handleDeleteSchedule}>
                Delete
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
