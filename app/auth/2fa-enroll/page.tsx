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
    } catch (err) {
      setError("Failed to initialize 2FA. Please try again.");
      setEnrolling(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    enroll2FA();
  }, [supabase, enroll2FA]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !factorId || code.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        code,
        challengeId: factorId, // Use factorId as challengeId for TOTP
      });

      if (error) {
        setError("Invalid code. Please try again.");
        setIsLoading(false);
        return;
      }

      // 2FA activated successfully
      router.push("/");
      router.refresh();
    } catch {
      setError("Verification failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <GlassCard className="max-w-md w-full p-8 space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/20 border border-white/10 mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Setup Google Authenticator</h1>
          <p className="text-white/50 text-sm">
            Scan the QR code below with your Google Authenticator app to secure your account
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {enrolling ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-pulse text-white/50 text-sm">Loading QR code...</div>
          </div>
        ) : qrCode ? (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="p-4 bg-white rounded-2xl">
                <Image
                  src={qrCode}
                  alt="2FA QR Code"
                  width={192}
                  height={192}
                  className="w-48 h-48"
                  unoptimized
                />
              </div>
              <p className="text-white/50 text-xs mt-3 text-center">
                Open Google Authenticator → Tap &quot;+&quot; → Scan this QR code
              </p>
            </div>

            {/* Manual entry key */}
            <div className="p-3 bg-white/5 rounded-xl">
              <p className="text-white/40 text-xs mb-1">Manual entry key</p>
              <p className="text-white/70 text-sm font-mono select-all">
                {qrCode.split("secret=")[1]?.split("&")[0] || "See QR code above"}
              </p>
            </div>

            {/* Verify form */}
            <form onSubmit={handleVerify} className="space-y-4">
              <GlassInput
                id="code"
                type="text"
                label="Verification Code"
                placeholder="Enter 6-digit code"
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
                Verify & Activate 2FA
              </GlassButton>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-red-400 text-sm">Failed to generate QR code.</p>
            <button type="button" onClick={enroll2FA} className="text-blue-400 text-sm mt-2 hover:underline">
              Try again
            </button>
          </div>
        )}

        <div className="text-center">
          <p className="text-white/50 text-xs">
            <Link href="/" className="text-blue-400 hover:underline">
              Skip for now
            </Link>{" "}
            — but highly recommended for security
          </p>
        </div>
      </GlassCard>
    </main>
  );
}
