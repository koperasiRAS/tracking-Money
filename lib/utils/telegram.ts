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
}): string {
  const { ticker, name, condition, targetPrice, currentPrice } = params;
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

  return `🎯 *Price Alert Triggered!*

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
