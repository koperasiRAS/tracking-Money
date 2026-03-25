"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DCAFrequency } from "@/types";

export interface DCAInput {
  ticker: string;
  name?: string;
  amount: number;
  frequency: DCAFrequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
  notes?: string;
}

function calculateNextDue(
  frequency: DCAFrequency,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const now = new Date();

  switch (frequency) {
    case "weekly": {
      const targetDay = dayOfWeek ?? 1; // Default Monday
      const currentDay = now.getDay();
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) daysUntilTarget += 7;
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + daysUntilTarget);
      nextDate.setHours(9, 0, 0, 0);
      return nextDate;
    }
    case "biweekly": {
      const targetDay = dayOfWeek ?? 1;
      const currentDay = now.getDay();
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) daysUntilTarget += 14;
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + daysUntilTarget);
      nextDate.setHours(9, 0, 0, 0);
      return nextDate;
    }
    case "monthly": {
      const targetDay = dayOfMonth ?? 1;
      const nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay, 9, 0, 0, 0);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      return nextDate;
    }
    case "quarterly": {
      const targetDay = dayOfMonth ?? 1;
      const nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay, 9, 0, 0, 0);
      if (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + 3);
      }
      return nextDate;
    }
  }
}

function getNextDueAfterTrigger(
  frequency: DCAFrequency,
  lastTriggered: Date,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  switch (frequency) {
    case "weekly": {
      const nextDate = new Date(lastTriggered);
      nextDate.setDate(lastTriggered.getDate() + 7);
      return nextDate;
    }
    case "biweekly": {
      const nextDate = new Date(lastTriggered);
      nextDate.setDate(lastTriggered.getDate() + 14);
      return nextDate;
    }
    case "monthly": {
      const targetDay = dayOfMonth ?? 1;
      const nextDate = new Date(lastTriggered.getFullYear(), lastTriggered.getMonth() + 1, targetDay, 9, 0, 0, 0);
      return nextDate;
    }
    case "quarterly": {
      const targetDay = dayOfMonth ?? 1;
      const nextDate = new Date(lastTriggered.getFullYear(), lastTriggered.getMonth() + 3, targetDay, 9, 0, 0, 0);
      return nextDate;
    }
  }
}

export async function getDCASchedules() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("dca_schedules")
    .select("*")
    .eq("user_id", user.id)
    .order("next_due", { ascending: true });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    ticker: item.ticker,
    name: item.name,
    amount: Number(item.amount),
    frequency: item.frequency,
    dayOfWeek: item.day_of_week,
    dayOfMonth: item.day_of_month,
    isActive: item.is_active,
    lastTriggered: item.last_triggered,
    nextDue: item.next_due,
    notes: item.notes,
    createdAt: item.created_at,
  })) || [];
}

export async function getActiveDCASchedules() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("dca_schedules")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("next_due", { ascending: true });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    ticker: item.ticker,
    name: item.name,
    amount: Number(item.amount),
    frequency: item.frequency,
    dayOfWeek: item.day_of_week,
    dayOfMonth: item.day_of_month,
    isActive: item.is_active,
    lastTriggered: item.last_triggered,
    nextDue: item.next_due,
    notes: item.notes,
    createdAt: item.created_at,
  })) || [];
}

export async function createDCASchedule(schedule: DCAInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const nextDue = calculateNextDue(
    schedule.frequency,
    schedule.dayOfWeek,
    schedule.dayOfMonth
  );

  const { data, error } = await supabase
    .from("dca_schedules")
    .insert({
      user_id: user.id,
      ticker: schedule.ticker.toUpperCase(),
      name: schedule.name || null,
      amount: schedule.amount,
      frequency: schedule.frequency,
      day_of_week: schedule.dayOfWeek ?? null,
      day_of_month: schedule.dayOfMonth ?? null,
      is_active: true,
      next_due: nextDue.toISOString(),
      notes: schedule.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dca");
  revalidatePath("/");

  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    name: data.name,
    amount: Number(data.amount),
    frequency: data.frequency,
    dayOfWeek: data.day_of_week,
    dayOfMonth: data.day_of_month,
    isActive: data.is_active,
    lastTriggered: data.last_triggered,
    nextDue: data.next_due,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function updateDCASchedule(
  id: string,
  updates: Partial<DCAInput> & { isActive?: boolean }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = {};
  if (updates.ticker !== undefined) updateData.ticker = updates.ticker.toUpperCase();
  if (updates.name !== undefined) updateData.name = updates.name || null;
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
  if (updates.dayOfWeek !== undefined) updateData.day_of_week = updates.dayOfWeek;
  if (updates.dayOfMonth !== undefined) updateData.day_of_month = updates.dayOfMonth;
  if (updates.notes !== undefined) updateData.notes = updates.notes || null;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  // Recalculate next_due if frequency changed
  if (updates.frequency !== undefined) {
    const nextDue = calculateNextDue(
      updates.frequency,
      updates.dayOfWeek,
      updates.dayOfMonth
    );
    updateData.next_due = nextDue.toISOString();
  }

  const { data, error } = await supabase
    .from("dca_schedules")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dca");
  revalidatePath("/");

  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    name: data.name,
    amount: Number(data.amount),
    frequency: data.frequency,
    dayOfWeek: data.day_of_week,
    dayOfMonth: data.day_of_month,
    isActive: data.is_active,
    lastTriggered: data.last_triggered,
    nextDue: data.next_due,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function deleteDCASchedule(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("dca_schedules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/dca");
  revalidatePath("/");
}

export async function markDCATriggered(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current schedule
  const { data: schedule, error: fetchError } = await supabase
    .from("dca_schedules")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) throw fetchError;

  const now = new Date();
  const nextDue = getNextDueAfterTrigger(
    schedule.frequency,
    now,
    schedule.day_of_week,
    schedule.day_of_month
  );

  const { error } = await supabase
    .from("dca_schedules")
    .update({
      last_triggered: now.toISOString(),
      next_due: nextDue.toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/dca");
}
