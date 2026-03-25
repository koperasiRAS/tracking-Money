"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { MutualFundCard } from "@/components/mutual-funds/MutualFundCard";
import { MutualFundModal } from "@/components/mutual-funds/MutualFundModal";
import { Skeleton } from "@/components/ui/Skeleton";
import type { MutualFund } from "@/types";
import {
  getMutualFunds,
  addMutualFund,
  updateMutualFund,
  deleteMutualFund,
} from "@/lib/actions/mutual-funds";

// Popular Indonesian mutual funds for quick add
const POPULAR_FUNDS = [
  { name: "BCA Dana Saham", ticker: "BCA-DS" },
  { name: "Mandiri Investa Ekuitas", ticker: "MI-20" },
  { name: "Nikko Saham Indonesia", ticker: "NSI" },
  { name: "Pacific Saham Optimal", ticker: "PSO" },
  { name: "Sucorinvest Equity Fund", ticker: "SEF" },
];

export default function MutualFundsPage() {
  const [funds, setFunds] = useState<MutualFund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<MutualFund | null>(null);
  const [navUpdateFund, setNavUpdateFund] = useState<MutualFund | null>(null);
  const [deletingFund, setDeletingFund] = useState<MutualFund | null>(null);

  useEffect(() => {
    loadFunds();
  }, []);

  const loadFunds = async () => {
    setIsLoading(true);
    try {
      const data = await getMutualFunds();
      setFunds(data);
    } catch (error) {
      console.error("Failed to load mutual funds:", error);
      // Use local storage fallback
      const saved = localStorage.getItem("mutual-funds");
      if (saved) {
        setFunds(JSON.parse(saved));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFund = async (data: { fundName: string; ticker: string; units: number; nav: number; purchaseDate: string }) => {
    const newFund = await addMutualFund(data);
    setFunds((prev) => [newFund, ...prev]);
  };

  const handleEditFund = async (data: { fundName: string; ticker: string; units: number; nav: number; purchaseDate: string }) => {
    if (!editingFund) return;
    const updatedFund = await updateMutualFund(editingFund.id, data);
    setFunds((prev) => prev.map((f) => (f.id === updatedFund.id ? updatedFund : f)));
    setEditingFund(null);
  };

  const handleUpdateNAV = async (data: { fundName: string; ticker: string; units: number; nav: number; purchaseDate: string }) => {
    if (!navUpdateFund) return;
    const updatedFund = await updateMutualFund(navUpdateFund.id, { nav: data.nav });
    setFunds((prev) => prev.map((f) => (f.id === updatedFund.id ? updatedFund : f)));
    setNavUpdateFund(null);
  };

  const handleDeleteFund = async () => {
    if (!deletingFund) return;
    await deleteMutualFund(deletingFund.id);
    setFunds((prev) => prev.filter((f) => f.id !== deletingFund.id));
    setDeletingFund(null);
  };

  const totalValue = funds.reduce((sum, f) => sum + f.units * f.nav, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Mutual Funds</h1>
          <p className="text-gray-500 mt-1">Track your investment fund holdings</p>
        </div>
        <GlassButton onClick={() => setIsModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Fund
        </GlassButton>
      </div>

      {/* Summary Card */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-500 text-sm">Total Mutual Funds Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isLoading ? "..." : formatCurrency(totalValue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">Holdings</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {funds.length} funds
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Quick Add Popular Funds */}
      {!isLoading && funds.length < 5 && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Indonesian Funds</h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR_FUNDS.filter((f) => !funds.find((fund) => fund.ticker === f.ticker))
              .slice(0, 5)
              .map((fund) => (
                <button
                  key={fund.ticker}
                  onClick={() => {
                    setEditingFund({
                      id: "",
                      userId: "",
                      fundName: fund.name,
                      ticker: fund.ticker,
                      units: 0,
                      nav: 0,
                      purchaseDate: "",
                      createdAt: "",
                    });
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-gray-900 text-sm transition-all"
                >
                  {fund.ticker}
                </button>
              ))}
          </div>
        </GlassCard>
      )}

      {/* Funds List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : funds.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No mutual funds yet</h3>
          <p className="text-gray-500 text-sm mb-4">Add your first fund to start tracking</p>
          <GlassButton onClick={() => setIsModalOpen(true)}>Add Your First Fund</GlassButton>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {funds.map((fund) => (
            <MutualFundCard
              key={fund.id}
              fund={fund}
              onEdit={(f) => setEditingFund(f)}
              onDelete={(f) => setDeletingFund(f)}
              onUpdateNAV={(f) => setNavUpdateFund(f)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <MutualFundModal
        isOpen={isModalOpen || !!editingFund}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFund(null);
        }}
        onSubmit={editingFund ? handleEditFund : handleAddFund}
        fund={editingFund}
      />

      {/* NAV Update Modal */}
      <MutualFundModal
        isOpen={!!navUpdateFund}
        onClose={() => setNavUpdateFund(null)}
        onSubmit={handleUpdateNAV}
        fund={navUpdateFund}
        isNAVUpdate
      />

      {/* Delete Confirmation */}
      {deletingFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingFund(null)} />
          <GlassCard className="relative w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900">Delete Fund</h3>
            <p className="text-gray-500">
              Are you sure you want to remove {deletingFund.fundName} from your tracking?
            </p>
            <div className="flex gap-3">
              <GlassButton variant="secondary" className="flex-1" onClick={() => setDeletingFund(null)}>
                Cancel
              </GlassButton>
              <GlassButton variant="danger" className="flex-1" onClick={handleDeleteFund}>
                Delete
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
