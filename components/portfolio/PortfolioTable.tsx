"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import type { PortfolioItem } from "@/types";
import { cn } from "@/lib/utils/cn";

interface PortfolioTableProps {
  items: PortfolioItem[];
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
}

export function PortfolioTable({ items, onEdit, onDelete }: PortfolioTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  if (items.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No stocks yet</h3>
        <p className="text-gray-500 text-sm mb-4">Add your first stock to start tracking your portfolio</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left px-6 py-4 text-gray-500 text-sm font-medium">Stock</th>
              <th className="text-right px-6 py-4 text-gray-500 text-sm font-medium">Shares</th>
              <th className="text-right px-6 py-4 text-gray-500 text-sm font-medium">Avg Price</th>
              <th className="text-right px-6 py-4 text-gray-500 text-sm font-medium">Total Value</th>
              <th className="text-right px-6 py-4 text-gray-500 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">
                        {item.ticker.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{item.ticker}</p>
                      {item.name && (
                        <p className="text-gray-400 text-sm">{item.name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-gray-900 dark:text-gray-100">
                  {formatNumber(item.shares, 4)}
                </td>
                <td className="px-6 py-4 text-right text-gray-900 dark:text-gray-100">
                  {formatCurrency(item.avgPrice)}
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-gray-900 font-medium">
                    {formatCurrency(item.shares * item.avgPrice)}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(item)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </GlassButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
