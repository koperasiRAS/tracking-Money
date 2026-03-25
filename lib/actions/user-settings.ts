"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserSettings {
  telegramToken?: string | null;
  telegramChatId?: string | null;
}

export async function getUserSettings() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw error;
  }

  return {
    telegramToken: data?.telegram_token || null,
    telegramChatId: data?.telegram_chat_id || null,
  };
}

export async function updateUserSettings(settings: UserSettings) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Upsert - insert or update
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: user.id,
      telegram_token: settings.telegramToken || null,
      telegram_chat_id: settings.telegramChatId || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/settings");

  return {
    telegramToken: data?.telegram_token || null,
    telegramChatId: data?.telegram_chat_id || null,
  };
}

export async function deleteUserSettings() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_settings")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/settings");
}
