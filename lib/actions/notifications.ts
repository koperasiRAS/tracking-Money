"use server";

import { sendTelegramMessage, formatAlertMessage, formatPortfolioSummary } from "@/lib/utils/telegram";
import type { Alert } from "@/types";
import type { PriceData } from "@/types";

export interface NotificationPayload {
  type: "alert" | "portfolio";
  token: string;
  chatId: string;
}

export async function sendAlertNotification(
  payload: NotificationPayload,
  alert: Alert,
  currentPrice: number
): Promise<boolean> {
  if (!payload.token || !payload.chatId) {
    console.error("Telegram credentials not configured");
    return false;
  }

  const message = formatAlertMessage({
    ticker: alert.ticker,
    name: alert.name,
    condition: alert.condition,
    targetPrice: alert.targetPrice,
    currentPrice,
    alertType: alert.alertType,
  });

  return sendTelegramMessage({
    token: payload.token,
    chatId: payload.chatId,
    text: message,
    parseMode: "Markdown",
  });
}

export async function sendPortfolioSummary(
  payload: NotificationPayload,
  data: {
    totalValue: number;
    totalChange: number;
    topGainer?: { ticker: string; change: number };
    topLoser?: { ticker: string; change: number };
  }
): Promise<boolean> {
  if (!payload.token || !payload.chatId) {
    console.error("Telegram credentials not configured");
    return false;
  }

  const message = formatPortfolioSummary(data);

  return sendTelegramMessage({
    token: payload.token,
    chatId: payload.chatId,
    text: message,
    parseMode: "Markdown",
  });
}
