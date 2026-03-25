"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";

export default function TwoFactorEnrollPage() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);
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

  useEffect(() => {
    enroll2FA();
  }, [enroll2FA]);

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

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <GlassCard className="max-w-md w-full p-8 space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
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
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-white/50 text-sm">Memuat kode QR...</div>
          </div>
        ) : qrCode ? (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl">
                <Image
                  src={qrCode}
                  alt="Kode QR 2FA"
                  width={192}
                  height={192}
                  className="w-48 h-48"
                  unoptimized
                />
              </div>
              <p className="text-white/50 text-xs mt-3 text-center">
                Buka Google Authenticator → Ketuk &quot;+&quot; → Scan kode QR ini
              </p>
            </div>

            {/* Manual entry key */}
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-white/40 text-xs mb-1">Kunci masuk manual</p>
              <p className="text-white/70 text-sm font-mono select-all">
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-red-400 text-sm">Gagal membuat kode QR.</p>
            <button type="button" onClick={enroll2FA} className="text-blue-400 text-sm mt-2 hover:underline">
              Coba lagi
            </button>
          </div>
        )}

        <div className="text-center">
          <p className="text-white/50 text-xs">
            <Link href="/dashboard" className="text-blue-400 hover:underline">
              Lewati untuk sekarang
            </Link>{" "}
            — tapi sangat direkomendasikan untuk keamanan
          </p>
        </div>
      </GlassCard>
    </main>
  );
}
