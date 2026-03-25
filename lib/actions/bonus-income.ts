"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BonusSourceType, BonusFrequency } from "@/types";

export interface BonusSourceInput {
  name: string;
  sourceType: BonusSourceType;
  expectedAmount: number;
  frequency: BonusFrequency;
  notes?: string;
}

// Get all bonus income sources
export async function getBonusSources() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bonus_income_sources")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    name: item.name,
    sourceType: item.source_type,
    expectedAmount: Number(item.expected_amount),
    frequency: item.frequency,
    isActive: item.is_active,
    notes: item.notes,
    createdAt: item.created_at,
  })) || [];
}

// Create bonus income source
export async function createBonusSource(source: BonusSourceInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bonus_income_sources")
    .insert({
      user_id: user.id,
      name: source.name,
      source_type: source.sourceType,
      expected_amount: source.expectedAmount,
      frequency: source.frequency,
      is_active: true,
      notes: source.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/income");

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    sourceType: data.source_type,
    expectedAmount: Number(data.expected_amount),
    frequency: data.frequency,
    isActive: data.is_active,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

// Update bonus income source
export async function updateBonusSource(id: string, updates: Partial<BonusSourceInput> & { isActive?: boolean }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.sourceType !== undefined) updateData.source_type = updates.sourceType;
  if (updates.expectedAmount !== undefined) updateData.expected_amount = updates.expectedAmount;
  if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
  if (updates.notes !== undefined) updateData.notes = updates.notes || null;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("bonus_income_sources")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/income");

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    sourceType: data.source_type,
    expectedAmount: Number(data.expected_amount),
    frequency: data.frequency,
    isActive: data.is_active,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

// Delete bonus income source
export async function deleteBonusSource(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("bonus_income_sources")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/income");
}

// Get bonus income records
export async function getBonusRecords() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bonus_income_records")
    .select("*")
    .eq("user_id", user.id)
    .order("received_date", { ascending: false });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    sourceId: item.source_id,
    name: item.name,
    amount: Number(item.amount),
    receivedDate: item.received_date,
    notes: item.notes,
    createdAt: item.created_at,
  })) || [];
}

// Add bonus income record
export async function addBonusRecord(record: {
  sourceId?: string;
  name: string;
  amount: number;
  receivedDate: string;
  notes?: string;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bonus_income_records")
    .insert({
      user_id: user.id,
      source_id: record.sourceId || null,
      name: record.name,
      amount: record.amount,
      received_date: record.receivedDate,
      notes: record.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/income");

  return {
    id: data.id,
    userId: data.user_id,
    sourceId: data.source_id,
    name: data.name,
    amount: Number(data.amount),
    receivedDate: data.received_date,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

// Delete bonus record
export async function deleteBonusRecord(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("bonus_income_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/income");
}
