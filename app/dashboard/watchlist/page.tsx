"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { WatchlistCard } from "@/components/watchlist/WatchlistCard";
import { Skeleton } from "@/components/ui/Skeleton";
import type { WatchlistItem } from "@/types";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlist,
  addDefaultWatchlist,
} from "@/lib/actions/watchlist";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [newTicker, setNewTicker] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"stock" | "fund">("stock");
  const [editTicker, setEditTicker] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"stock" | "fund">("stock");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setIsLoading(true);
    try {
      let data = await getWatchlist();

      // If empty, add default watchlist
      if (data.length === 0) {
        await addDefaultWatchlist();
        data = await getWatchlist();
      }

      setItems(data);
      localStorage.setItem("watchlist", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to load watchlist:", error);
      // Use local storage fallback
      const saved = localStorage.getItem("watchlist");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker.trim()) return;

    setIsAdding(true);
    try {
      const newItem = await addToWatchlist({
        ticker: newTicker,
        name: newName || undefined,
        type: newType,
      });
      setItems((prev) => [newItem, ...prev]);
      setNewTicker("");
      setNewName("");
      setNewType("stock");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditItem = (item: WatchlistItem) => {
    setEditingItem(item);
    setEditTicker(item.ticker);
    setEditName(item.name || "");
    setEditType(item.type || "stock");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTicker.trim()) return;

    setIsAdding(true);
    try {
      const updated = await updateWatchlist(editingItem.id, {
        ticker: editTicker,
        name: editName,
        type: editType,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i))
      );
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to update watchlist:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveItem = async (item: WatchlistItem) => {
    try {
      await removeFromWatchlist(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
    }
  };

  const popularStocks = [
    { ticker: "BBCA", name: "Bank Central Asia" },
    { ticker: "BBRI", name: "Bank Rakyat Indonesia" },
    { ticker: "BMRI", name: "Bank Mandiri" },
    { ticker: "TLKM", name: "Telkom Indonesia" },
    { ticker: "UNVR", name: "Unilever Indonesia" },
    { ticker: "ASII", name: "Astra International" },
    { ticker: "PGAS", name: "PGAS Nusantara" },
    { ticker: "ANTM", name: "Aneka Tambang" },
    { ticker: "INDF", name: "Indofood" },
    { ticker: "ICBP", name: "Indofood CBP" },
  ];

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Watchlist</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your favorite Indonesian stocks</p>
        </div>
        <GlassButton onClick={() => setIsModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Stock
        </GlassButton>
      </div>

      {/* Quick Add Popular Stocks */}
      {!isLoading && items.length < 5 && (
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Popular Indonesian Stocks</h2>
          <div className="flex flex-wrap gap-2">
            {popularStocks
              .filter((s) => !items.find((i) => i.ticker === s.ticker))
              .slice(0, 8)
              .map((stock) => (
                <button
                  key={stock.ticker}
                  onClick={async () => {
                    await addToWatchlist({ ticker: stock.ticker, name: stock.name });
                    loadWatchlist();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-sm transition-all"
                >
                  {stock.ticker}
                </button>
              ))}
          </div>
        </GlassCard>
      )}

      {/* Watchlist Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
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
      ) : items.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No stocks in watchlist</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Add stocks to track their prices</p>
          <GlassButton onClick={() => setIsModalOpen(true)}>Add Your First Stock</GlassButton>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <WatchlistCard
              key={item.id}
              item={item}
              onEdit={handleEditItem}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      )}

      {/* Add Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default" onClick={() => setIsModalOpen(false)} type="button" aria-label="Close modal" />
          <GlassCard className="relative w-full max-w-md p-6 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add to Watchlist</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <GlassInput
                label="Ticker Symbol"
                placeholder="BBCA"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                required
              />
              <GlassInput
                label="Company Name (Optional)"
                placeholder="Bank Central Asia"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <GlassSelect
                label="Type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as "stock" | "fund")}
                options={[
                  { value: "stock", label: "Stock" },
                  { value: "fund", label: "Fund" },
                ]}
              />

              <div className="flex gap-3 pt-2">
                <GlassButton
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </GlassButton>
                <GlassButton type="submit" className="flex-1" isLoading={isAdding}>
                  Add
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Edit Stock Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default" onClick={() => setIsEditModalOpen(false)} type="button" aria-label="Close modal" />
          <GlassCard className="relative w-full max-w-md p-6 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Watchlist Item</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <GlassInput
                label="Ticker Symbol"
                placeholder="BBCA"
                value={editTicker}
                onChange={(e) => setEditTicker(e.target.value.toUpperCase())}
                required
              />
              <GlassInput
                label="Company Name (Optional)"
                placeholder="Bank Central Asia"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <GlassSelect
                label="Type"
                value={editType}
                onChange={(e) => setEditType(e.target.value as "stock" | "fund")}
                options={[
                  { value: "stock", label: "Stock" },
                  { value: "fund", label: "Fund" },
                ]}
              />

              <div className="flex gap-3 pt-2">
                <GlassButton
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </GlassButton>
                <GlassButton type="submit" className="flex-1" isLoading={isAdding}>
                  Save Changes
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
