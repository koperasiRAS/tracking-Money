"use client";

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";

interface PerformanceData {
  date: string;
  value: number;
  label?: string;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  title?: string;
  color?: string;
  showArea?: boolean;
}

export function PerformanceChart({
  data,
  title = "Performance",
  color = "#3B82F6",
  showArea = true,
}: PerformanceChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
  };

  if (data.length === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
          No historical data available
        </div>
      </GlassCard>
    );
  }

  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const change = lastValue - firstValue;
  const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
  const isPositive = change >= 0;

  const gradientId = `gradient-${title.replace(/\s/g, "-")}`;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="text-right">
          <p className="text-gray-900 font-medium">{formatCurrency(lastValue)}</p>
          <p className={`text-sm ${isPositive ? "text-green-600" : "text-red-500"}`}>
            {isPositive ? "+" : ""}{changePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="rgba(0,0,0,0.2)"
              tick={{ fill: "rgba(0,0,0,0.5)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              stroke="rgba(0,0,0,0.2)"
              tick={{ fill: "rgba(0,0,0,0.5)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 15, 35, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
              }}
              formatter={(value: number) => [formatCurrency(value), "Value"]}
              labelFormatter={(label) => formatDate(label as string)}
            />
            {showArea ? (
              <>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
