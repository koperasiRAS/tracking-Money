"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { Skeleton } from "@/components/ui/Skeleton";
import type { BonusIncomeSource, BonusIncomeRecord, BonusSourceType, BonusFrequency } from "@/types";
import {
  getBonusSources,
  createBonusSource,
  updateBonusSource,
  deleteBonusSource,
  getBonusRecords,
  addBonusRecord,
  deleteBonusRecord,
} from "@/lib/actions/bonus-income";
import { getDividendSchedules, getDividendRecords } from "@/lib/actions/dividends";
import { getPortfolioForDividends } from "@/lib/actions/dividends";

const FREQUENCY_MULTIPLIER: Record<string, number> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
  once: 0,
};

const SOURCE_TYPE_CONFIG: Record<BonusSourceType, { label: string; icon: string; color: string }> = {
  salary_bonus: { label: "Salary Bonus", icon: "💼", color: "blue" },
  thr: { label: "THR / Bonus", icon: "🎁", color: "purple" },
  rental: { label: "Rental Income", icon: "🏠", color: "green" },
  freelance: { label: "Freelance", icon: "💻", color: "cyan" },
  dividend: { label: "Stock Dividend", icon: "📈", color: "emerald" },
  interest: { label: "Interest", icon: "🏦", color: "yellow" },
  royalty: { label: "Royalty", icon: "📚", color: "orange" },
  side_hustle: { label: "Side Hustle", icon: "🚀", color: "pink" },
  other: { label: "Other", icon: "💰", color: "gray" },
};

export default function IncomePage() {
  const [sources, setSources] = useState<BonusIncomeSource[]>([]);
  const [records, setRecords] = useState<BonusIncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<BonusIncomeSource | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [sourceType, setSourceType] = useState<BonusSourceType>("salary_bonus");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [frequency, setFrequency] = useState<BonusFrequency>("annual");
  const [notes, setNotes] = useState("");

  // Record form
  const [recName, setRecName] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recDate, setRecDate] = useState("");
  const [recSourceId, setRecSourceId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sourcesData, recordsData] = await Promise.all([
        getBonusSources(),
        getBonusRecords(),
      ]);
      setSources(sourcesData);
      setRecords(recordsData);
    } catch (error) {
      console.error("Failed to load income data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSourceType("salary_bonus");
    setExpectedAmount("");
    setFrequency("annual");
    setNotes("");
    setEditingSource(null);
  };

  const openEditModal = (source: BonusIncomeSource) => {
    setEditingSource(source);
    setName(source.name);
    setSourceType(source.sourceType);
    setExpectedAmount(source.expectedAmount.toString());
    setFrequency(source.frequency);
    setNotes(source.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveSource = async () => {
    const amount = parseFloat(expectedAmount);
    if (!name.trim()) return;
    if (isNaN(amount) || amount <= 0) return;

    try {
      if (editingSource) {
        await updateBonusSource(editingSource.id, {
          name: name.trim(),
          sourceType,
          expectedAmount: amount,
          frequency,
          notes: notes.trim(),
        });
      } else {
        await createBonusSource({
          name: name.trim(),
          sourceType,
          expectedAmount: amount,
          frequency,
          notes: notes.trim(),
        });
      }
      const updated = await getBonusSources();
      setSources(updated);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save source:", error);
    }
  };

  const handleToggleSource = async (source: BonusIncomeSource) => {
    try {
      await updateBonusSource(source.id, { isActive: !source.isActive });
      setSources((prev) => prev.map((s) => s.id === source.id ? { ...s, isActive: !s.isActive } : s));
    } catch (error) {
      console.error("Failed to toggle source:", error);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await deleteBonusSource(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete source:", error);
    }
  };

  const handleAddRecord = async () => {
    const amount = parseFloat(recAmount);
    if (!recName.trim() || !recDate) return;
    if (isNaN(amount) || amount <= 0) return;

    try {
      await addBonusRecord({
        sourceId: recSourceId || undefined,
        name: recName.trim(),
        amount,
        receivedDate: recDate,
      });
      const updated = await getBonusRecords();
      setRecords(updated);
      setIsRecordModalOpen(false);
      setRecName("");
      setRecAmount("");
      setRecDate("");
      setRecSourceId("");
    } catch (error) {
      console.error("Failed to add record:", error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteBonusRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Failed to delete record:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate totals
  const activeSources = sources.filter((s) => s.isActive);
  const annualTotal = activeSources.reduce((sum, s) => {
    const mult = FREQUENCY_MULTIPLIER[s.frequency] || 0;
    return sum + s.expectedAmount * mult;
  }, 0);
  const monthlyAverage = annualTotal / 12;

  // This year records
  const currentYear = new Date().getFullYear();
  const thisYearRecords = records.filter((r) => new Date(r.receivedDate).getFullYear() === currentYear);
  const thisYearTotal = thisYearRecords.reduce((sum, r) => sum + r.amount, 0);

  // This month records
  const currentMonth = new Date().getMonth();
  const thisMonthRecords = records.filter((r) => {
    const d = new Date(r.receivedDate);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const thisMonthTotal = thisMonthRecords.reduce((sum, r) => sum + r.amount, 0);

  // Group sources by type
  const groupedSources = activeSources.reduce((acc, s) => {
    if (!acc[s.sourceType]) acc[s.sourceType] = [];
    const mult = FREQUENCY_MULTIPLIER[s.frequency] || 0;
    acc[s.sourceType].push({ ...s, annualAmount: s.expectedAmount * mult });
    return acc;
  }, {} as Record<BonusSourceType, (BonusIncomeSource & { annualAmount: number })[]>);

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Bonus Income Planner</h1>
          <p className="text-white/50 mt-1">Plan and track your extra income for investing</p>
        </div>
        <div className="flex gap-3">
          <GlassButton variant="secondary" onClick={() => setIsRecordModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Log Received
          </GlassButton>
          <GlassButton onClick={() => setIsModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Source
          </GlassButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{formatCurrency(annualTotal)}</p>
          <p className="text-white/50 text-sm">Projected Annual</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(monthlyAverage)}</p>
          <p className="text-white/50 text-sm">Avg Monthly</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{formatCurrency(thisYearTotal)}</p>
          <p className="text-white/50 text-sm">Received This Year</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(thisMonthTotal)}</p>
          <p className="text-white/50 text-sm">This Month</p>
        </GlassCard>
      </div>

      {/* Info Card */}
      <GlassCard className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-medium">Plan Your Investment Budget</p>
            <p className="text-white/50 text-sm mt-1">
              Add your expected bonus income sources (THR, salary bonus, freelance, etc.) to plan how much you can invest regularly.
              The system calculates your projected annual income and monthly average.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Income Sources by Type */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <GlassCard key={i} className="p-4">
              <Skeleton className="h-24 w-full" />
            </GlassCard>
          ))}
        </div>
      ) : activeSources.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No income sources yet</h3>
          <p className="text-white/50 text-sm mb-4">Add your bonus income sources to plan your investment budget</p>
          <GlassButton onClick={() => setIsModalOpen(true)}>Add First Source</GlassButton>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSources).map(([type, items]) => {
            const config = SOURCE_TYPE_CONFIG[type as BonusSourceType] || SOURCE_TYPE_CONFIG.other;
            const typeTotal = items.reduce((sum, i) => sum + i.annualAmount, 0);

            return (
              <GlassCard key={type} className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-${config.color}-500/20 flex items-center justify-center text-xl`}>
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{config.label}</h3>
                    <p className="text-white/50 text-sm">{items.length} source{items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">{formatCurrency(typeTotal)}</p>
                    <p className="text-white/40 text-xs">annual</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div>
                        <p className="text-white">{item.name}</p>
                        <p className="text-white/40 text-xs">
                          {formatCurrency(item.expectedAmount)} × {FREQUENCY_MULTIPLIER[item.frequency] || 1}/year
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <GlassButton variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </GlassButton>
                        <GlassButton variant="ghost" size="sm" onClick={() => handleDeleteSource(item.id)}>
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </GlassButton>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Received Records */}
      {records.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Received Records</h2>
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="p-4 text-white/50 text-sm font-medium">Name</th>
                    <th className="p-4 text-white/50 text-sm font-medium">Date</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Amount</th>
                    <th className="p-4 text-white/50 text-sm font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white">{r.name}</td>
                      <td className="p-4 text-white/70">{new Date(r.receivedDate).toLocaleDateString("id-ID")}</td>
                      <td className="p-4 text-right text-green-400 font-medium">{formatCurrency(r.amount)}</td>
                      <td className="p-4 text-right">
                        <GlassButton variant="ghost" size="sm" onClick={() => handleDeleteRecord(r.id)}>
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </GlassButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Add/Edit Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); resetForm(); }} />
          <GlassCard className="relative w-full max-w-md p-6 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingSource ? "Edit Income Source" : "Add Income Source"}
              </h2>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <GlassInput
                label="Source Name"
                placeholder="e.g. THR 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <GlassSelect
                label="Source Type"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as BonusSourceType)}
                options={Object.entries(SOURCE_TYPE_CONFIG).map(([value, config]) => ({
                  value,
                  label: `${config.icon} ${config.label}`,
                }))}
              />
              <GlassInput
                label="Expected Amount (IDR)"
                type="number"
                step="1000"
                min="0"
                placeholder="5000000"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
              />
              <GlassSelect
                label="Frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as BonusFrequency)}
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "quarterly", label: "Quarterly (4x/year)" },
                  { value: "semiannual", label: "Semi-Annual (2x/year)" },
                  { value: "annual", label: "Annual (1x/year)" },
                  { value: "once", label: "One-time" },
                ]}
              />
              <GlassInput
                label="Notes (Optional)"
                placeholder="Notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <GlassButton variant="secondary" className="flex-1" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                Cancel
              </GlassButton>
              <GlassButton className="flex-1" onClick={handleSaveSource}>
                {editingSource ? "Update" : "Add"}
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Log Received Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsRecordModalOpen(false)} />
          <GlassCard className="relative w-full max-w-md p-6 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Log Received Income</h2>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <GlassSelect
                label="Link to Source (Optional)"
                value={recSourceId}
                onChange={(e) => setRecSourceId(e.target.value)}
                options={[
                  { value: "", label: "No linked source" },
                  ...sources.map((s) => ({ value: s.id, label: `${s.name} (${s.sourceType})` })),
                ]}
              />
              <GlassInput
                label="Name"
                placeholder="e.g. THR 2024"
                value={recName}
                onChange={(e) => setRecName(e.target.value)}
              />
              <GlassInput
                label="Amount Received (IDR)"
                type="number"
                step="1000"
                min="0"
                placeholder="5000000"
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
              />
              <GlassInput
                label="Date Received"
                type="date"
                value={recDate}
                onChange={(e) => setRecDate(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <GlassButton variant="secondary" className="flex-1" onClick={() => setIsRecordModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton className="flex-1" onClick={handleAddRecord}>
                Log
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
