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
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await getUserSettings();
      if (settings.telegramToken) setTelegramToken(settings.telegramToken);
      if (settings.telegramChatId) setTelegramChatId(settings.telegramChatId);
    } catch (error) {
      console.error("Gagal memuat pengaturan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await updateUserSettings({
        telegramToken: telegramToken || null,
        telegramChatId: telegramChatId || null,
      });

      setMessage({ type: "success", text: "Pengaturan berhasil disimpan!" });
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      setMessage({ type: "error", text: "Gagal menyimpan pengaturan." });
    } finally {
      setIsSaving(false);
    }
  };

  const testTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      setMessage({ type: "error", text: "Isi bot token dan chat ID terlebih dahulu." });
      return;
    }

    setIsTesting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: telegramToken, chatId: telegramChatId }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Pesan test berhasil dikirim! Cek Telegram Anda." });
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Gagal mengirim pesan test." });
      }
    } catch {
      setMessage({ type: "error", text: "Gagal mengirim pesan test." });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto space-y-6 animate-in">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <GlassCard className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Pengaturan</h1>
        <p className="text-white/50 text-sm mt-0.5">Konfigurasi notifikasi dan preferensi</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === "success" ? "bg-green-500/20 border border-green-500/30 text-green-400" : "bg-red-500/20 border border-red-500/30 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* Telegram Settings */}
      <GlassCard className="p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-white">Notifikasi Telegram</h2>
          <p className="text-white/40 text-sm mt-0.5">Terima peringatan melalui bot Telegram</p>
        </div>

        <div className="space-y-4">
          <GlassInput
            label="Bot Token"
            placeholder="Contoh: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            value={telegramToken}
            onChange={(e) => setTelegramToken(e.target.value)}
          />
          <GlassInput
            label="Chat ID"
            placeholder="Contoh: 7745710806"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton onClick={handleSave} isLoading={isSaving}>
            Simpan Pengaturan
          </GlassButton>
          <GlassButton variant="secondary" onClick={testTelegram} isLoading={isTesting}>
            Test Notifikasi
          </GlassButton>
        </div>

        <div className="text-sm text-white/30 space-y-1">
          <p>Cara mendapatkan Chat ID:</p>
          <ol className="list-decimal list-inside space-y-0.5 ml-2">
            <li>Buat bot via @BotFather di Telegram, copy token-nya</li>
            <li>Buka chat dengan bot yang baru dibuat</li>
            <li>Kirim pesan apapun ke bot</li>
            <li>Kunjungi <code className="bg-white/10 px-1 rounded">api.telegram.org/bot[TOKEN]/getUpdates</code></li>
            <li> Cari <code className="bg-white/10 px-1 rounded">{'"'}id{'"'}:</code> di response — itu Chat ID Anda</li>
          </ol>
        </div>
      </GlassCard>
    </main>
  );
}
