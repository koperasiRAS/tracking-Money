export interface TelegramMessage {
  token: string;
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown";
}

export async function sendTelegramMessage(message: TelegramMessage): Promise<boolean> {
  try {
    const { token, chatId, text, parseMode = "Markdown" } = message;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

// Format alert message for Telegram
export function formatAlertMessage(params: {
  ticker: string;
  name?: string | null;
  condition: "above" | "below";
  targetPrice: number;
  currentPrice: number;
  alertType?: string;
}): string {
  const { ticker, name, condition, targetPrice, currentPrice, alertType } = params;
  const direction = condition === "above" ? "📈" : "📉";
  const status = condition === "above" ? "exceeded" : "dropped below";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Alert type labels
  const typeLabel = alertType === "buy" ? "🟢 *BUY ZONE*" :
    alertType === "avg_down" ? "🟡 *AVG DOWN*" :
    alertType === "warning" ? "🔴 *WARNING*" :
    null;

  const typeSection = typeLabel ? `\n🏷️ ${typeLabel}\n` : "\n";

  return `🎯 *Price Alert Triggered!*
${typeSection}
${direction} *${ticker}*${name ? ` (${name})` : ""}

${direction} Price has ${status} your target!

📍 Target: ${formatCurrency(targetPrice)}
💰 Current: ${formatCurrency(currentPrice)}
📊 Change: ${((currentPrice / targetPrice - 1) * 100).toFixed(2)}%

---
_Invest Tracker Pro_`;
}

// Format portfolio summary for Telegram
export function formatPortfolioSummary(params: {
  totalValue: number;
  totalChange: number;
  topGainer?: { ticker: string; change: number };
  topLoser?: { ticker: string; change: number };
}): string {
  const { totalValue, totalChange, topGainer, topLoser } = params;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  let message = `📊 *Portfolio Daily Summary*

💰 Total Value: ${formatCurrency(totalValue)}
${totalChange >= 0 ? "📈" : "📉"} Daily Change: ${totalChange >= 0 ? "+" : ""}${formatCurrency(totalChange)}`;

  if (topGainer) {
    message += `\n\n🏆 Top Gainer: *${topGainer.ticker}* (+${topGainer.change.toFixed(2)}%)`;
  }

  if (topLoser) {
    message += `\n📉 Top Loser: *${topLoser.ticker}* (${topLoser.change.toFixed(2)}%)`;
  }

  message += `\n\n---
_Invest Tracker Pro_`;

  return message;
}

// Format DCA reminder message for Telegram
export function formatDCAReminder(params: {
  ticker: string;
  name?: string | null;
  amount: number;
  frequency: string;
  nextDue: string;
}): string {
  const { ticker, name, amount, frequency, nextDue } = params;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const frequencyLabel: Record<string, string> = {
    weekly: "Mingguan",
    biweekly: "Dua Minggu",
    monthly: "Bulanan",
    quarterly: "Triwulanan",
  };

  const nextDate = new Date(nextDue);
  const formattedDate = nextDate.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `📅 *DCA Reminder!*

💰 *${ticker}*${name ? ` (${name})` : ""}

💵 Amount: ${formatCurrency(amount)}
🔄 Frequency: ${frequencyLabel[frequency] || frequency}
📆 Next Due: ${formattedDate}

Don't forget to execute your DCA plan!

---
_Invest Tracker Pro_`;
}

// Format DCA triggered (executed) message
export function formatDCATriggered(params: {
  ticker: string;
  name?: string | null;
  amount: number;
  frequency: string;
}): string {
  const { ticker, name, amount, frequency } = params;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const frequencyLabel: Record<string, string> = {
    weekly: "Mingguan",
    biweekly: "Dua Minggu",
    monthly: "Bulanan",
    quarterly: "Triwulanan",
  };

  return `✅ *DCA Executed!*

💰 *${ticker}*${name ? ` (${name})` : ""}

💵 Amount: ${formatCurrency(amount)}
🔄 Frequency: ${frequencyLabel[frequency] || frequency}
⏰ Time: ${new Date().toLocaleString("id-ID")}

Keep investing consistently!

---
_Invest Tracker Pro_`;
}
