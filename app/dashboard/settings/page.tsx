"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { getUserSettings, updateUserSettings } from "@/lib/actions/user-settings";

export default function SettingsPage() {
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await getUserSettings();
      if (settings.telegramToken) setTelegramToken(settings.telegramToken);
      if (settings.telegramChatId) setTelegramChatId(settings.telegramChatId);

      // Also check localStorage for legacy data
      const localToken = localStorage.getItem("telegram_token");
      const localChatId = localStorage.getItem("telegram_chat_id");
      if (localToken && !settings.telegramToken) setTelegramToken(localToken);
      if (localChatId && !settings.telegramChatId) setTelegramChatId(localChatId);
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Fallback to localStorage
      const savedToken = localStorage.getItem("telegram_token");
      const savedChatId = localStorage.getItem("telegram_chat_id");
      if (savedToken) setTelegramToken(savedToken);
      if (savedChatId) setTelegramChatId(savedChatId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Save to database
      await updateUserSettings({
        telegramToken: telegramToken || null,
        telegramChatId: telegramChatId || null,
      });

      // Also save to localStorage as backup
      if (telegramToken) localStorage.setItem("telegram_token", telegramToken);
      if (telegramChatId) localStorage.setItem("telegram_chat_id", telegramChatId);

      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const testTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      setMessage({ type: "error", text: "Please fill in both Telegram token and chat ID" });
      return;
    }

    setMessage(null);

    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: telegramToken, chatId: telegramChatId }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Test message sent! Check your Telegram." });
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Failed to send test message" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to send test message" });
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto space-y-8 animate-in">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <GlassCard className="p-6 space-y-6">
          <Skeleton className="h-32" />
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/50 mt-1">Configure your notification preferences</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === "success" ? "bg-green-500/20 border border-green-500/30 text-green-400" : "bg-red-500/20 border border-red-500/30 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* Telegram Settings */}
      <GlassCard className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Telegram Notifications</h2>
            <p className="text-white/50 text-sm">Receive alerts via Telegram bot</p>
          </div>
        </div>

        <div className="space-y-4">
          <GlassInput
            label="Bot Token"
            placeholder="123456:ABC-DEF..."
            value={telegramToken}
            onChange={(e) => setTelegramToken(e.target.value)}
          />
          <GlassInput
            label="Chat ID"
            placeholder="7745710806"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <GlassButton onClick={handleSave} isLoading={isSaving}>
            Save Settings
          </GlassButton>
          <GlassButton variant="secondary" onClick={testTelegram}>
            Test Notification
          </GlassButton>
        </div>

        <div className="text-sm text-white/40 space-y-1">
          <p>To get your Chat ID:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Create a bot via @BotFather and copy the token</li>
            <li>Start a chat with your bot</li>
            <li>Send a message to your bot</li>
            <li>Visit <code className="bg-white/10 px-1 rounded">api.telegram.org/bot[TOKEN]/getUpdates</code></li>
            <li>Find your chat ID in the response</li>
          </ol>
        </div>
      </GlassCard>
    </main>
  );
}
