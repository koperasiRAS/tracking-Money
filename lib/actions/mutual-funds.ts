"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface MutualFundInput {
  fundName: string;
  ticker?: string;
  units: number;
  nav: number;
  purchaseDate?: string;
}

export async function getMutualFunds() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("mutual_funds")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    fundName: item.fund_name,
    ticker: item.ticker,
    units: item.units,
    nav: item.nav,
    purchaseDate: item.purchase_date,
    createdAt: item.created_at,
  })) || [];
}

export async function addMutualFund(fund: MutualFundInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("mutual_funds")
    .insert({
      user_id: user.id,
      fund_name: fund.fundName,
      ticker: fund.ticker || null,
      units: fund.units,
      nav: fund.nav,
      purchase_date: fund.purchaseDate || null,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/mutual-funds");
  revalidatePath("/");

  return {
    id: data.id,
    userId: data.user_id,
    fundName: data.fund_name,
    ticker: data.ticker,
    units: data.units,
    nav: data.nav,
    purchaseDate: data.purchase_date,
    createdAt: data.created_at,
  };
}

export async function updateMutualFund(
  id: string,
  updates: Partial<MutualFundInput>
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = {};
  if (updates.fundName !== undefined) updateData.fund_name = updates.fundName;
  if (updates.ticker !== undefined) updateData.ticker = updates.ticker || null;
  if (updates.units !== undefined) updateData.units = updates.units;
  if (updates.nav !== undefined) updateData.nav = updates.nav;
  if (updates.purchaseDate !== undefined) updateData.purchase_date = updates.purchaseDate || null;

  const { data, error } = await supabase
    .from("mutual_funds")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/mutual-funds");
  revalidatePath("/");

  return {
    id: data.id,
    userId: data.user_id,
    fundName: data.fund_name,
    ticker: data.ticker,
    units: data.units,
    nav: data.nav,
    purchaseDate: data.purchase_date,
    createdAt: data.created_at,
  };
}

export async function deleteMutualFund(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("mutual_funds")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/mutual-funds");
  revalidatePath("/");
}
