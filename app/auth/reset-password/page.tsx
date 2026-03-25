"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      // Redirect to login with success message
      router.push("/auth/login?reset=success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mereset kata sandi. Coba lagi.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-base">
      {/* ===== LEFT PANEL - Branding ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0f0f23] via-[#0d1f2d] to-[#0a2a1a]">

        {/* Decorative background orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-600/5 rounded-full blur-3xl" />

        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Left Panel Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-16 w-full">
          {/* Logo / Brand */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Invest Track</span>
            </div>
            <span className="text-white/40 text-xs ml-[52px]">by Rangga</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Kata Sandi<br />
            <span className="text-green-400">Baru</span><br />
            Yang Aman
          </h1>

          <p className="text-white/50 text-lg mb-16 max-w-md leading-relaxed">
            Masukkan kata sandi baru yang kuat dan mudah diingat. Pastikan menggunakan minimal 8 karakter.
          </p>

          {/* Bottom decoration */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400/60 text-xs">Aman & Terenkripsi</span>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL - Reset Password Form ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-900 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-green-50 dark:bg-green-900/10 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-green-50 dark:bg-green-900/10 rounded-full" />

        <div className="relative z-10 w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Invest Track</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">by Rangga</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Kata Sandi Baru</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Masukkan kata sandi baru untuk akun Anda.</p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <GlassInput
              label="Kata Sandi Baru"
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <GlassInput
              label="Konfirmasi Kata Sandi"
              type="password"
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <GlassButton type="submit" className="w-full" isLoading={isLoading}>
              Simpan Kata Sandi
            </GlassButton>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Ingat kata sandi Anda?{" "}
              <Link
                href="/auth/login"
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold transition-colors"
              >
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
