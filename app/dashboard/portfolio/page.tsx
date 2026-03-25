"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { PortfolioTable } from "@/components/portfolio/PortfolioTable";
import { PortfolioModal } from "@/components/portfolio/PortfolioModal";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import type { PortfolioItem } from "@/types";
import {
  getPortfolio,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from "@/lib/actions/portfolio";

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    setIsLoading(true);
    try {
      const data = await getPortfolio();
      setItems(data);
      // Also save to localStorage for dashboard
      localStorage.setItem("portfolio", JSON.stringify(data.map((item) => ({
        id: item.id,
        ticker: item.ticker,
        shares: item.shares,
        avgPrice: item.avgPrice,
        totalValue: item.shares * item.avgPrice,
      }))));
    } catch (error) {
      console.error("Failed to load portfolio:", error);
      // Redirect to login if not authenticated
      // router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (data: { ticker: string; name: string; shares: number; avgPrice: number }) => {
    const newItem = await addPortfolioItem(data);
    setItems((prev) => [newItem, ...prev]);
  };

  const handleEditItem = async (data: { ticker: string; name: string; shares: number; avgPrice: number }) => {
    if (!editingItem) return;
    const updatedItem = await updatePortfolioItem(editingItem.id, data);
    setItems((prev) => prev.map((item) => item.id === updatedItem.id ? updatedItem : item));
    setEditingItem(null);
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    await deletePortfolioItem(deletingItem.id);
    setItems((prev) => prev.filter((item) => item.id !== deletingItem.id));
    setDeletingItem(null);
  };

  const totalValue = items.reduce((sum, item) => sum + item.shares * item.avgPrice, 0);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Portfolio</h1>
          <p className="text-gray-500 mt-1">Track your stock holdings</p>
        </div>
        <GlassButton onClick={() => setIsModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Stock
        </GlassButton>
      </div>

      {/* Summary Card */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-500 text-sm">Total Portfolio Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isLoading ? "..." : formatCurrency(totalValue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">Holdings</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {items.length} stocks
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Portfolio Table */}
      {isLoading ? (
        <GlassCard className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </GlassCard>
      ) : (
        <PortfolioTable
          items={items}
          onEdit={(item) => setEditingItem(item)}
          onDelete={(item) => setDeletingItem(item)}
        />
      )}

      {/* Add/Edit Modal */}
      <PortfolioModal
        isOpen={isModalOpen || !!editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={editingItem ? handleEditItem : handleAddItem}
        item={editingItem}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletingItem(null)}
          />
          <GlassCard className="relative w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Stock</h3>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Are you sure you want to remove {deletingItem.ticker} from your portfolio?
            </p>
            <div className="flex gap-3">
              <GlassButton
                variant="secondary"
                className="flex-1"
                onClick={() => setDeletingItem(null)}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="danger"
                className="flex-1"
                onClick={handleDeleteItem}
              >
                Delete
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
