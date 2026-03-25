import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token, chatId } = await request.json();

    if (!token || !chatId) {
      return NextResponse.json(
        { error: "Token and chatId are required" },
        { status: 400 }
      );
    }

    const message = "✅ Test message from Invest Tracker Pro! Your notifications are configured correctly.";

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.description || "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
