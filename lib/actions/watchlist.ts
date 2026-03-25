"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface WatchlistItemInput {
  ticker: string;
  name?: string;
  type?: "stock" | "fund";
}

// Default Indonesian stock tickers
export const DEFAULT_WATCHLIST = [
  { ticker: "BBCA", name: "Bank Central Asia", type: "stock" as const },
  { ticker: "BBRI", name: "Bank Rakyat Indonesia", type: "stock" as const },
  { ticker: "BMRI", name: "Bank Mandiri", type: "stock" as const },
  { ticker: "TLKM", name: "Telkom Indonesia", type: "stock" as const },
  { ticker: "UNVR", name: "Unilever Indonesia", type: "stock" as const },
  { ticker: "ASII", name: "Astra International", type: "stock" as const },
  { ticker: "HMSN", name: "Hansoh Brewery", type: "stock" as const },
  { ticker: "BRIS", name: "BRISyariah", type: "stock" as const },
];

export async function getWatchlist() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data?.map((item) => ({
    id: item.id,
    userId: item.user_id,
    ticker: item.ticker,
    name: item.name,
    type: item.type,
    createdAt: item.created_at,
  })) || [];
}

export async function addToWatchlist(item: WatchlistItemInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("watchlist")
    .insert({
      user_id: user.id,
      ticker: item.ticker.toUpperCase(),
      name: item.name || null,
      type: item.type || "stock",
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/watchlist");
  revalidatePath("/");

  return {
    id: data.id,
    userId: data.user_id,
    ticker: data.ticker,
    name: data.name,
    type: data.type,
    createdAt: data.created_at,
  };
}

export async function removeFromWatchlist(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/watchlist");
  revalidatePath("/");
}

export async function addDefaultWatchlist() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if watchlist is empty
  const { data: existing } = await supabase
    .from("watchlist")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return; // Already has items
  }

  // Add default watchlist items
  const items = DEFAULT_WATCHLIST.map((item) => ({
    user_id: user.id,
    ticker: item.ticker,
    name: item.name,
    type: item.type,
  }));

  const { error } = await supabase.from("watchlist").insert(items);

  if (error && error.code !== "23505") {
    // Ignore unique constraint errors
    throw error;
  }

  revalidatePath("/watchlist");
}
