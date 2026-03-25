"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { AlertCard } from "@/components/alerts/AlertCard";
import { AlertModal } from "@/components/alerts/AlertModal";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Alert } from "@/types";
import type { PriceData } from "@/types";
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
} from "@/lib/actions/alerts";
import { getPrices } from "@/lib/actions/prices";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<Alert | null>(null);
  const [defaultTicker, setDefaultTicker] = useState("");
  const [defaultName, setDefaultName] = useState("");

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    // Fetch prices for all alert tickers
    if (alerts.length > 0) {
      const tickers = Array.from(new Set(alerts.map((a) => a.ticker)));
      getPrices(tickers).then(setPrices);
    }
  }, [alerts]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await getAlerts();
      setAlerts(data);
      localStorage.setItem("alerts", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to load alerts:", error);
      // Use local storage fallback
      const saved = localStorage.getItem("alerts");
      if (saved) {
        setAlerts(JSON.parse(saved));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlert = async (data: { ticker: string; name: string; condition: "above" | "below"; targetPrice: number; alertType?: "buy" | "avg_down" | "warning" | "default"; priority?: number }) => {
    const newAlert = await createAlert(data);
    setAlerts((prev) => [newAlert, ...prev]);
    // Also fetch price for the new ticker
    const priceData = await getPrices([data.ticker]);
    setPrices((prev) => ({ ...prev, ...priceData }));
  };

  const handleEditAlert = async (data: { ticker: string; name: string; condition: "above" | "below"; targetPrice: number; alertType?: "buy" | "avg_down" | "warning" | "default"; priority?: number }) => {
    if (!editingAlert) return;
    const updatedAlert = await updateAlert(editingAlert.id, data);
    setAlerts((prev) => prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)));
    setEditingAlert(null);
  };

  const handleToggleAlert = async (alert: Alert) => {
    const updatedAlert = await updateAlert(alert.id, { isActive: !alert.isActive });
    setAlerts((prev) => prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a)));
  };

  const handleDeleteAlert = async () => {
    if (!deletingAlert) return;
    await deleteAlert(deletingAlert.id);
    setAlerts((prev) => prev.filter((a) => a.id !== deletingAlert.id));
    setDeletingAlert(null);
  };

  const activeAlerts = alerts.filter((a) => a.isActive);
  const triggeredAlerts = alerts.filter((a) => !a.isActive && a.lastTriggered);
  const buyAlerts = alerts.filter((a) => a.alertType === "buy" && a.isActive);
  const avgDownAlerts = alerts.filter((a) => a.alertType === "avg_down" && a.isActive);
  const warningAlerts = alerts.filter((a) => a.alertType === "warning" && a.isActive);

  return (
    <main className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Alerts</h1>
          <p className="text-gray-500 mt-1">Get notified when prices hit your targets</p>
        </div>
        <GlassButton onClick={() => setIsModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Alert
        </GlassButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <GlassCard className="p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{activeAlerts.length}</p>
          <p className="text-gray-500 text-xs">Active</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-xl font-bold text-green-600">{buyAlerts.length}</p>
          <p className="text-gray-500 text-xs">Buy Zone</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-xl font-bold text-yellow-400">{avgDownAlerts.length}</p>
          <p className="text-gray-500 text-xs">Avg Down</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-xl font-bold text-red-500">{warningAlerts.length}</p>
          <p className="text-gray-500 text-xs">Warning</p>
        </GlassCard>
        <GlassCard className="p-3 text-center">
          <p className="text-xl font-bold text-purple-400">{triggeredAlerts.length}</p>
          <p className="text-gray-500 text-xs">Triggered</p>
        </GlassCard>
      </div>

      {/* Alerts List */}
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
      ) : alerts.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts yet</h3>
          <p className="text-gray-500 text-sm mb-4">Create your first price alert to get notified</p>
          <GlassButton onClick={() => setIsModalOpen(true)}>Create Your First Alert</GlassButton>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              currentPrice={prices[alert.ticker]?.price}
              onEdit={(a) => setEditingAlert(a)}
              onDelete={(a) => setDeletingAlert(a)}
              onToggle={handleToggleAlert}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AlertModal
        isOpen={isModalOpen || !!editingAlert}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAlert(null);
        }}
        onSubmit={editingAlert ? handleEditAlert : handleCreateAlert}
        alert={editingAlert}
        defaultTicker={defaultTicker}
        defaultName={defaultName}
      />

      {/* Delete Confirmation */}
      {deletingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeletingAlert(null)} />
          <GlassCard className="relative w-full max-w-sm p-6 space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-900">Delete Alert</h3>
            <p className="text-gray-500">
              Are you sure you want to delete this alert for {deletingAlert.ticker}?
            </p>
            <div className="flex gap-3">
              <GlassButton variant="secondary" className="flex-1" onClick={() => setDeletingAlert(null)}>
                Cancel
              </GlassButton>
              <GlassButton variant="danger" className="flex-1" onClick={handleDeleteAlert}>
                Delete
              </GlassButton>
            </div>
          </GlassCard>
        </div>
      )}
    </main>
  );
}
