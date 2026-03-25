"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PortfolioItemInput {
  ticker: string;
  name?: string;
  shares: number;
  avgPrice: number;
}

export async function getPortfolio() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("portfolio")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    ticker: item.ticker,
    name: item.name,
    shares: item.shares,
    avgPrice: item.avg_price,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  })) || [];
}

export async function addPortfolioItem(item: PortfolioItemInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("portfolio")
    .insert({
      user_id: user.id,
      ticker: item.ticker.toUpperCase(),
      name: item.name || null,
      shares: item.shares,
      avg_price: item.avgPrice,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/portfolio");
  revalidatePath("/dashboard");

  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    name: data.name,
    shares: data.shares,
    avgPrice: data.avg_price,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updatePortfolioItem(
  id: string,
  updates: Partial<PortfolioItemInput>
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = {};
  if (updates.ticker !== undefined) updateData.ticker = updates.ticker.toUpperCase();
  if (updates.name !== undefined) updateData.name = updates.name || null;
  if (updates.shares !== undefined) updateData.shares = updates.shares;
  if (updates.avgPrice !== undefined) updateData.avg_price = updates.avgPrice;

  const { data, error } = await supabase
    .from("portfolio")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/portfolio");
  revalidatePath("/dashboard");

  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    name: data.name,
    shares: data.shares,
    avgPrice: data.avg_price,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deletePortfolioItem(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("portfolio")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/dashboard/portfolio");
  revalidatePath("/dashboard");
}
