"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";

export default function TwoFactorEnrollPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollAttempted, setEnrollAttempted] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@/lib/supabase/client").createClient> | null>(null);
  const router = useRouter();

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      setSupabase(createClient());
    });
  }, []);

  const enroll2FA = useCallback(async () => {
    if (!supabase) return;
    setEnrolling(true);
    setError("");
    setEnrollAttempted(true);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Google Authenticator",
      });

      if (error) {
        setError(error.message);
        setEnrolling(false);
        return;
      }

      if (data) {
        setQrCode(data.totp.qr_code);
        setFactorId(data.id);
        setEnrolling(false);
      }
    } catch {
      setError("Gagal menginisialisasi 2FA. Silakan coba lagi.");
      setEnrolling(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Auto-enroll on mount (first attempt)
  useEffect(() => {
    if (supabase && !enrollAttempted) {
      enroll2FA();
    }
  }, [supabase, enrollAttempted, enroll2FA]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !factorId || code.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      // Buat challenge FRESH SAAT user klik verifikasi (bukan saat enroll)
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError || !challenge) {
        setError("Gagal memulai verifikasi. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      // Verifikasi dengan challenge baru (belum expire)
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        code,
        challengeId: challenge.id,
      });

      if (verifyError) {
        setError("Kode tidak valid. Pastikan kode yang Anda masukkan benar.");
        setCode("");
        setIsLoading(false);
        return;
      }

      // 2FA berhasil diaktifkan
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
          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Atur Google Authenticator</h1>
          <p className="text-white/50 text-sm">
            Scan kode QR di bawah dengan aplikasi Google Authenticator untuk mengamankan akun Anda
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {enrolling ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
            <p className="text-white/50 text-sm">Memuat kode QR...</p>
          </div>
        ) : qrCode ? (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl shadow-md">
                <Image
                  src={qrCode}
                  alt="Kode QR 2FA"
                  width={192}
                  height={192}
                  className="w-48 h-48"
                  unoptimized
                />
              </div>
              <p className="text-white/50 text-xs mt-3 text-center px-2">
                Buka Google Authenticator → Ketuk &quot;+&quot; → Pilih &quot;Scan barcode&quot; → Arahkan ke kode QR ini
              </p>
            </div>

            {/* Manual entry key */}
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-white/40 text-xs mb-1">Kunci masuk manual (jika QR tidak bisa discan)</p>
              <p className="text-white/70 text-sm font-mono select-all break-all">
                {qrCode.split("secret=")[1]?.split("&")[0] || "Lihat kode QR di atas"}
              </p>
            </div>

            {/* Verify form */}
            <form onSubmit={handleVerify} className="space-y-4">
              <GlassInput
                id="code"
                type="text"
                label="Kode Verifikasi"
                placeholder="Masukkan 6 digit kode"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center text-2xl tracking-widest font-mono"
              />

              <GlassButton
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={code.length !== 6}
              >
                Verifikasi & Aktifkan 2FA
              </GlassButton>
            </form>

            {/* Retry QR */}
            <button
              type="button"
              onClick={enroll2FA}
              className="w-full text-center text-white/30 hover:text-white/50 text-xs transition-colors py-1"
            >
              QR tidak muncul? Coba generate ulang
            </button>
          </div>
        ) : (
          /* QR failed to load */
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-white/60 text-sm mb-1">Gagal memuat kode QR</p>
              <p className="text-white/30 text-xs">
                Pastikan koneksi internet stabil, lalu coba lagi.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={enroll2FA}
                className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold text-sm transition-all shadow-md shadow-green-500/20 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Coba Lagi
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-sm transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-2 border-t border-white/10">
          <p className="text-white/30 text-xs">
            <button type="button" onClick={handleSignOut} className="hover:text-white/50 transition-colors">
              Lewati untuk sekarang
            </button>{" "}
            — tapi sangat direkomendasikan untuk keamanan
          </p>
        </div>
      </GlassCard>
    </main>
  );
}
