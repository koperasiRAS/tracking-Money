"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DividendFrequency } from "@/types";

export interface DividendScheduleInput {
  ticker: string;
  name?: string;
  annualYieldPercent?: number;
  dividendPerShare?: number;
  frequency?: DividendFrequency;
  nextExDate?: string;
  nextPayDate?: string;
  notes?: string;
}

// Get all dividend schedules for a user
export async function getDividendSchedules() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("dividend_schedules")
    .select("*")
    .eq("user_id", user.id)
    .order("ticker", { ascending: true });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    ticker: item.ticker,
    name: item.name,
    annualYieldPercent: Number(item.annual_yield_percent),
    dividendPerShare: Number(item.dividend_per_share),
    frequency: item.frequency,
    nextExDate: item.next_ex_date,
    nextPayDate: item.next_pay_date,
    notes: item.notes,
    createdAt: item.created_at,
  })) || [];
}

// Create or update dividend schedule
export async function upsertDividendSchedule(schedule: DividendScheduleInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("dividend_schedules")
    .upsert({
      user_id: user.id,
      ticker: schedule.ticker.toUpperCase(),
      name: schedule.name || null,
      annual_yield_percent: schedule.annualYieldPercent || 0,
      dividend_per_share: schedule.dividendPerShare || 0,
      frequency: schedule.frequency || "quarterly",
      next_ex_date: schedule.nextExDate || null,
      next_pay_date: schedule.nextPayDate || null,
      notes: schedule.notes || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dividends");

  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    name: data.name,
    annualYieldPercent: Number(data.annual_yield_percent),
    dividendPerShare: Number(data.dividend_per_share),
    frequency: data.frequency,
    nextExDate: data.next_ex_date,
    nextPayDate: data.next_pay_date,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

// Delete dividend schedule
export async function deleteDividendSchedule(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("dividend_schedules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/dividends");
}

// Get dividend records
export async function getDividendRecords() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("dividend_records")
    .select("*")
    .eq("user_id", user.id)
    .order("ex_date", { ascending: false });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    ticker: item.ticker,
    exDate: item.ex_date,
    payDate: item.pay_date,
    amountPerShare: Number(item.amount_per_share),
    totalReceived: item.total_received ? Number(item.total_received) : null,
    sharesCount: item.shares_count,
    currency: item.currency,
    notes: item.notes,
    createdAt: item.created_at,
  })) || [];
}

// Add dividend record
export async function addDividendRecord(record: {
  ticker: string;
  exDate: string;
  payDate?: string;
  amountPerShare: number;
  sharesCount?: number;
  notes?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const totalReceived = record.sharesCount
    ? record.amountPerShare * record.sharesCount
    : null;

  const { data, error } = await supabase
    .from("dividend_records")
    .insert({
      user_id: user.id,
      ticker: record.ticker.toUpperCase(),
      ex_date: record.exDate,
      pay_date: record.payDate || null,
      amount_per_share: record.amountPerShare,
      total_received: totalReceived,
      shares_count: record.sharesCount || null,
      currency: "IDR",
      notes: record.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dividends");

  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    exDate: data.ex_date,
    payDate: data.pay_date,
    amountPerShare: Number(data.amount_per_share),
    totalReceived: data.total_received ? Number(data.total_received) : null,
    sharesCount: data.shares_count,
    currency: data.currency,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

// Delete dividend record
export async function deleteDividendRecord(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("dividend_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/dividends");
}

// Get portfolio items for dividend calculation
export async function getPortfolioForDividends() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("portfolio")
    .select("*")
    .eq("user_id", user.id)
    .order("ticker", { ascending: true });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    ticker: item.ticker,
    name: item.name,
    shares: Number(item.shares),
    avgPrice: Number(item.avg_price),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  })) || [];
}
