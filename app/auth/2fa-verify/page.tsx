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
      // Get TOTP factor
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.all?.find(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );

      if (!totpFactor) {
        // No 2FA found, redirect to enroll
        router.push("/auth/2fa-enroll");
        return;
      }

      // Create a challenge first (required before verify)
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError || !challenge) {
        setError("Failed to start verification. Please try again.");
        setIsLoading(false);
        return;
      }

      // Verify with the challenge ID
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        code,
        challengeId: challenge.id,
      });

      if (verifyError) {
        setAttempts((a) => a + 1);
        if (attempts >= 2) {
          setError("Too many failed attempts. Please wait and try again.");
        } else {
          setError("Invalid code. Please try again.");
        }
        setCode("");
        setIsLoading(false);
        return;
      }

      // Clear MFA pending cookie
      document.cookie = "mfa_pending=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Verify successful
      router.push("/");
      router.refresh();
    } catch {
      setError("Verification failed. Please try again.");
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-white/10 mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
          <p className="text-white/50 text-sm">
            Enter the 6-digit code from your Google Authenticator app
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
            label="Verification Code"
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
            Verify Code
          </GlassButton>
        </form>

        {/* Timer hint */}
        <div className="text-center">
          <p className="text-white/30 text-xs">
            Code changes every 30 seconds. Make sure your phone time is synced.
          </p>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full text-center text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            Sign out and use a different account
          </button>
        </div>
      </GlassCard>
    </main>
  );
}
