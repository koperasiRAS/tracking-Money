"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof import("@/lib/supabase/client").createClient> | null>(null);

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      setSupabase(createClient());
    });
  }, []);

  const handleGoogleRegister = async () => {
    if (!supabase) return;
    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Gagal memulai pendaftaran. Silakan coba lagi.");
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
              <span className="text-2xl font-bold text-white tracking-tight">INVESTTRACK PRO</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Mulai Perjalanan<br />
            <span className="text-green-400">Investasi Anda</span><br />
            Sekarang
          </h1>

          <p className="text-white/50 text-lg mb-16 max-w-md leading-relaxed">
            Daftar gratis dan mulai melacak portofolio saham Anda dengan alat yang powerful dan mudah digunakan.
          </p>

          {/* Feature highlights */}
          <div className="space-y-5">
            {[
              { icon: "🔐", text: "Aman dengan 2FA Google Authenticator" },
              { icon: "📊", text: "Lacak Portofolio Secara Real-time" },
              { icon: "🔔", text: "Peringatan Harga Otomatis" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg backdrop-blur-sm">
                  {item.icon}
                </div>
                <span className="text-white/70 text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Bottom decoration - financial chart visual */}
          <div className="mt-16 flex items-end gap-2">
            {[30, 45, 35, 55, 48, 70, 60, 80, 70, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-green-500/20 rounded-sm border-t border-green-500/40 transition-all duration-300 hover:bg-green-500/40"
                style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400/60 text-xs">Proses Pendaftaran Gratis</span>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL - Register Form ===== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-green-50 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-green-50 rounded-full" />

        <div className="relative z-10 w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">INVESTTRACK PRO</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Buat Akun Baru</h2>
            <p className="text-gray-5000 text-sm">Daftar dengan Google untuk memulai</p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isLoading || !supabase}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-sm text-gray-7000 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isLoading ? "Mengalihkan..." : "Daftar dengan Google"}
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-4000">atau</span>
            </div>
          </div>

          {/* Note about email/password */}
          <div className="text-center py-4 border border-gray-100 rounded-xl bg-gray-50">
            <p className="text-gray-4000 text-sm">
              Saat ini hanya pendaftaran dengan{" "}
              <span className="font-medium text-gray-600">Google</span> yang tersedia
            </p>
          </div>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-gray-5000 text-sm">
              Sudah punya akun?{" "}
              <Link
                href="/auth/login"
                className="text-green-600 hover:text-green-700 font-semibold transition-colors"
              >
                Masuk
              </Link>
            </p>
          </div>

          {/* Security note */}
          <div className="mt-8 flex items-start gap-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-gray-4000 text-xs leading-relaxed">
              Setelah daftar, Anda akan diarahkan untuk mengatur 2FA dengan Google Authenticator.
              Akun dilindungi dengan Supabase Row Level Security.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
