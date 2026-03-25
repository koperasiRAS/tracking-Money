"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import type { MutualFund } from "@/types";
import { cn } from "@/lib/utils/cn";

interface MutualFundCardProps {
  fund: MutualFund;
  onEdit: (fund: MutualFund) => void;
  onDelete: (fund: MutualFund) => void;
  onUpdateNAV?: (fund: MutualFund) => void;
}

export function MutualFundCard({ fund, onEdit, onDelete, onUpdateNAV }: MutualFundCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 4) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const totalValue = fund.units * fund.nav;

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Fund Badge */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>

          {/* Fund Info */}
          <div>
            <p className="text-gray-900 font-semibold">{fund.fundName}</p>
            {fund.ticker && (
              <p className="text-green-600 text-sm">{fund.ticker}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
              <span className="text-gray-500">
                Units: <span className="text-gray-900">{formatNumber(fund.units, 2)}</span>
              </span>
              <span className="text-gray-500">
                NAV: <span className="text-gray-900">{formatCurrency(fund.nav)}</span>
              </span>
              {fund.purchaseDate && (
                <span className="text-gray-300">
                  Purchased: {new Date(fund.purchaseDate).toLocaleDateString("id-ID")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Value and Actions */}
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(totalValue)}
          </p>
          <p className="text-gray-400 text-sm">Total Value</p>

          <div className="flex items-center gap-2 mt-3">
            {onUpdateNAV && (
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => onUpdateNAV(fund)}
                title="Update NAV"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </GlassButton>
            )}
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => onEdit(fund)}
              title="Edit Fund"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => onDelete(fund)}
              title="Delete Fund"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
