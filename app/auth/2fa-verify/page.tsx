"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";

export default function TwoFactorVerifyPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@/lib/supabase/client").createClient> | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      setSupabase(createClient());
    });
  }, []);

  // Get factor ID on mount
  useEffect(() => {
    if (!supabase) return;

    const getFactor = async () => {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.all?.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );
      if (!totpFactor) {
        // No 2FA found, redirect to enroll
        router.push("/auth/2fa-enroll");
        return;
      }
      setFactorId(totpFactor.id);
    };

    getFactor();
  }, [supabase, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !factorId || code.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      // Buat challenge FRESH SAAT user klik verifikasi
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError || !challenge) {
        setError("Gagal memulai verifikasi. Pastikan koneksi internet stabil.");
        setIsLoading(false);
        return;
      }

      // Verifikasi
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        code,
        challengeId: challenge.id,
      });

      if (verifyError) {
        setAttempts((a) => a + 1);
        if (attempts >= 4) {
          setError("Terlalu banyak percobaan gagal. Tunggu 30 detik dan coba lagi.");
        } else {
          setError("Kode tidak valid. Pastikan waktu di HP Anda sinkron.");
        }
        setCode("");
        setIsLoading(false);
        return;
      }

      // Hapus cookie MFA pending jika ada
      document.cookie = "mfa_pending=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Berhasil
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Verifikasi gagal. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <GlassCard className="max-w-md w-full p-8 space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Verifikasi Dua Faktor</h1>
          <p className="text-white/50 text-sm">
            Masukkan kode 6 digit dari aplikasi Google Authenticator
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <GlassInput
            id="code"
            type="text"
            label="Kode Verifikasi"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            required
            className="text-center text-3xl tracking-[0.5em] font-mono"
            inputMode="numeric"
            autoFocus
          />

          <GlassButton
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={code.length !== 6 || !factorId}
          >
            Verifikasi Kode
          </GlassButton>
        </form>

        <div className="text-center">
          <p className="text-white/30 text-xs">
            Kode berubah setiap 30 detik. Pastikan waktu di HP Anda sinkron.
          </p>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-center text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            Keluar dan gunakan akun lain
          </button>
        </div>
      </GlassCard>
    </main>
  );
}
