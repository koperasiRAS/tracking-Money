import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchMultiplePrices } from "@/lib/utils/finance";
import { sendAlertNotification, sendDCAReminder } from "@/lib/actions/notifications";

// Force dynamic rendering for cron job
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This API route is called by Vercel Cron every day at 9 AM
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Cron] Starting price check...");

    // Check if Supabase is configured
    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      console.log("[Cron] Supabase not configured, skipping...");
      return NextResponse.json({
        success: true,
        message: "Supabase not configured",
        checked: 0,
        triggered: 0,
      });
    }

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select("*")
      .eq("is_active", true);

    if (alertsError) {
      console.error("[Cron] Error fetching alerts:", alertsError);
      return NextResponse.json(
        { error: "Failed to fetch alerts" },
        { status: 500 }
      );
    }

    if (!alerts || alerts.length === 0) {
      console.log("[Cron] No active alerts to check");
      return NextResponse.json({
        success: true,
        message: "No active alerts",
        checked: 0,
        triggered: 0,
      });
    }

    // Get unique tickers
    const tickers = Array.from(new Set(alerts.map((a: { ticker: string }) => a.ticker)));
    console.log(`[Cron] Checking ${tickers.length} tickers...`);

    // Fetch current prices
    const prices = await fetchMultiplePrices(tickers);

    // Get all user settings in one query for efficiency
    const userIds = Array.from(new Set(alerts.map((a: { user_id: string }) => a.user_id)));
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("user_id, telegram_token, telegram_chat_id")
      .in("user_id", userIds);

    const settingsMap = new Map(
      (userSettings || []).map((s: { user_id: string; telegram_token: string | null; telegram_chat_id: string | null }) =>
        [s.user_id, { token: s.telegram_token, chatId: s.telegram_chat_id }]
      )
    );

    let triggeredCount = 0;
    const triggeredAlerts: string[] = [];

    // Check each alert against current price
    for (const alert of alerts) {
      const price = prices.get(alert.ticker);

      if (!price) {
        console.log(`[Cron] No price data for ${alert.ticker}`);
        continue;
      }

      const shouldTrigger =
        (alert.condition === "above" && price.price >= Number(alert.target_price)) ||
        (alert.condition === "below" && price.price <= Number(alert.target_price));

      if (shouldTrigger) {
        console.log(`[Cron] Alert triggered for ${alert.ticker}: ${alert.alert_type || "default"} ${alert.condition} ${alert.target_price}, current: ${price.price}`);

        // Get user's Telegram settings from per-user settings
        const userSetting = settingsMap.get(alert.user_id);
        const token = userSetting?.token || process.env.TELEGRAM_BOT_TOKEN;
        const chatId = userSetting?.chatId || process.env.TELEGRAM_CHAT_ID;

        if (token && chatId) {
          // Send Telegram notification
          const sent = await sendAlertNotification(
            { type: "alert", token, chatId },
            {
              id: alert.id,
              userId: alert.user_id,
              ticker: alert.ticker,
              name: alert.name,
              condition: alert.condition,
              targetPrice: Number(alert.target_price),
              isActive: alert.is_active,
              lastTriggered: alert.last_triggered,
              createdAt: alert.created_at,
              alertType: alert.alert_type,
              priority: alert.priority,
            },
            price.price
          );

          if (sent) {
            console.log(`[Cron] Telegram notification sent for ${alert.ticker} (user: ${alert.user_id})`);
          }
        }

        // Mark alert as triggered
        await supabase
          .from("alerts")
          .update({
            last_triggered: new Date().toISOString(),
            is_active: false,
          })
          .eq("id", alert.id);

        triggeredCount++;
        triggeredAlerts.push(alert.ticker);
      }
    }

    // Check DCA schedules
    console.log("[Cron] Checking DCA schedules...");

    const { data: dcaSchedules, error: dcaError } = await supabase
      .from("dca_schedules")
      .select("*")
      .eq("is_active", true)
      .lte("next_due", new Date().toISOString());

    if (dcaError) {
      console.error("[Cron] Error fetching DCA schedules:", dcaError);
    } else if (dcaSchedules && dcaSchedules.length > 0) {
      console.log(`[Cron] Found ${dcaSchedules.length} due DCA schedules`);

      // Get all user settings
      const dcaUserIds = Array.from(new Set(dcaSchedules.map((s: { user_id: string }) => s.user_id)));
      const { data: dcaUserSettings } = await supabase
        .from("user_settings")
        .select("user_id, telegram_token, telegram_chat_id")
        .in("user_id", dcaUserIds);

      const dcaSettingsMap = new Map(
        (dcaUserSettings || []).map((s: { user_id: string; telegram_token: string | null; telegram_chat_id: string | null }) =>
          [s.user_id, { token: s.telegram_token, chatId: s.telegram_chat_id }]
        )
      );

      for (const schedule of dcaSchedules) {
        const userSetting = dcaSettingsMap.get(schedule.user_id);
        const token = userSetting?.token || process.env.TELEGRAM_BOT_TOKEN;
        const chatId = userSetting?.chatId || process.env.TELEGRAM_CHAT_ID;

        if (token && chatId) {
          const sent = await sendDCAReminder(
            { type: "alert", token, chatId },
            {
              id: schedule.id,
              userId: schedule.user_id,
              ticker: schedule.ticker,
              name: schedule.name,
              amount: Number(schedule.amount),
              frequency: schedule.frequency,
              dayOfWeek: schedule.day_of_week,
              dayOfMonth: schedule.day_of_month,
              isActive: schedule.is_active,
              lastTriggered: schedule.last_triggered,
              nextDue: schedule.next_due,
              notes: schedule.notes,
              createdAt: schedule.created_at,
            }
          );

          if (sent) {
            console.log(`[Cron] DCA reminder sent for ${schedule.ticker} (user: ${schedule.user_id})`);
          }
        }
      }
    }

    console.log(`[Cron] Completed. Checked ${alerts.length} alerts, triggered ${triggeredCount}`);

    return NextResponse.json({
      success: true,
      checked: alerts.length,
      triggered: triggeredCount,
      triggeredTickers: triggeredAlerts,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
