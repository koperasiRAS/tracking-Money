"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AlertInput {
  ticker: string;
  name?: string;
  condition: "above" | "below";
  targetPrice: number;
  alertType?: "buy" | "avg_down" | "warning" | "default";
  priority?: number;
}

export async function getAlerts() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    ticker: item.ticker,
    name: item.name,
    condition: item.condition,
    targetPrice: item.target_price,
    isActive: item.is_active,
    lastTriggered: item.last_triggered,
    createdAt: item.created_at,
    alertType: item.alert_type,
    priority: item.priority,
  })) || [];
}

export async function getActiveAlerts() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    ticker: item.ticker,
    name: item.name,
    condition: item.condition,
    targetPrice: item.target_price,
    isActive: item.is_active,
    lastTriggered: item.last_triggered,
    createdAt: item.created_at,
    alertType: item.alert_type,
    priority: item.priority,
  })) || [];
}

export async function createAlert(alert: AlertInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      user_id: user.id,
      ticker: alert.ticker.toUpperCase(),
      name: alert.name || null,
      condition: alert.condition,
      target_price: alert.targetPrice,
      is_active: true,
      alert_type: alert.alertType || "default",
      priority: alert.priority || 2,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/alerts");
  revalidatePath("/");

  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    name: data.name,
    condition: data.condition,
    targetPrice: data.target_price,
    isActive: data.is_active,
    lastTriggered: data.last_triggered,
    createdAt: data.created_at,
    alertType: data.alert_type,
    priority: data.priority,
  };
}

export async function updateAlert(
  id: string,
  updates: Partial<AlertInput> & { isActive?: boolean }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = {};
  if (updates.ticker !== undefined) updateData.ticker = updates.ticker.toUpperCase();
  if (updates.name !== undefined) updateData.name = updates.name || null;
  if (updates.condition !== undefined) updateData.condition = updates.condition;
  if (updates.targetPrice !== undefined) updateData.target_price = updates.targetPrice;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (updates.alertType !== undefined) updateData.alert_type = updates.alertType;
  if (updates.priority !== undefined) updateData.priority = updates.priority;

  const { data, error } = await supabase
    .from("alerts")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/alerts");
  revalidatePath("/");

  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    name: data.name,
    condition: data.condition,
    targetPrice: data.target_price,
    isActive: data.is_active,
    lastTriggered: data.last_triggered,
    createdAt: data.created_at,
    alertType: data.alert_type,
    priority: data.priority,
  };
}

export async function deleteAlert(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("alerts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/alerts");
  revalidatePath("/");
}

export async function markAlertTriggered(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("alerts")
    .update({
      last_triggered: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/alerts");
}
