import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchMultiplePrices } from "@/lib/utils/finance";
import { sendAlertNotification } from "@/lib/actions/notifications";

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
        console.log(`[Cron] Alert triggered for ${alert.ticker}: ${alert.condition} ${alert.target_price}, current: ${price.price}`);

        // Get user's Telegram settings
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

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
            },
            price.price
          );

          if (sent) {
            console.log(`[Cron] Telegram notification sent for ${alert.ticker}`);
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
