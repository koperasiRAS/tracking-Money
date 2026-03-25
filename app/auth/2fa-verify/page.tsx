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
  const router = useRouter();

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      setSupabase(createClient());
    });
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || code.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      // Dapatkan faktor TOTP
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.all?.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );

      if (!totpFactor) {
        router.push("/auth/2fa-enroll");
        return;
      }

      // Buat challenge dulu (diperlukan sebelum verify)
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError || !challenge) {
        setError("Gagal memulai verifikasi. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      // Verifikasi dengan challenge ID
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        code,
        challengeId: challenge.id,
      });

      if (verifyError) {
        setAttempts((a) => a + 1);
        if (attempts >= 2) {
          setError("Terlalu banyak percobaan gagal. Silakan tunggu dan coba lagi.");
        } else {
          setError("Kode tidak valid. Silakan coba lagi.");
        }
        setCode("");
        setIsLoading(false);
        return;
      }

      // Hapus cookie MFA pending
      document.cookie = "mfa_pending=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Verifikasi berhasil
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
            disabled={code.length !== 6 || attempts >= 5}
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
