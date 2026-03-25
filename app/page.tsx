"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/50">Memuat...</div>
      </main>
    );
  }

  // Jika sudah login, tampilkan halaman sukses
  if (user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full text-center space-y-8 animate-in">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white">
              Selamat Datang Kembali!
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Anda login sebagai {user.email}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link href="/dashboard">
              <GlassButton size="lg" className="w-full sm:w-auto">
                Buka Dashboard
              </GlassButton>
            </Link>
            <Link href="/dashboard/settings">
              <GlassButton variant="secondary" size="lg" className="w-full sm:w-auto">
                Pengaturan
              </GlassButton>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Jika belum login, tampilkan landing page
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full text-center space-y-8 animate-in">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Invest Tracker Pro
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Pantau saham Indonesia dan reksa dana dengan peringatan harga real-time melalui Telegram.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Pelacakan Portfolio</h3>
            <p className="text-white/50 text-sm">
              Lacak saham dan reksa dana dengan valuasi real-time.
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Peringatan Harga</h3>
            <p className="text-white/50 text-sm">
              Atur peringatan dan dapatkan notifikasi saat saham menyentuh harga target.
            </p>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Notifikasi Telegram</h3>
            <p className="text-white/50 text-sm">
              Dapatkan pemberitahuan instan di Telegram saat peringatan aktif.
            </p>
          </GlassCard>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link href="/auth/login">
            <GlassButton size="lg" className="w-full sm:w-auto">
              Masuk dengan Google
            </GlassButton>
          </Link>
          <Link href="/auth/register">
            <GlassButton variant="primary" size="lg" className="w-full sm:w-auto">
              Daftar Akun
            </GlassButton>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-white/30 text-sm mt-8">
          Dibuat untuk investor Indonesia. Lacak secara manual, investasikan dengan bijak.
        </p>
      </div>
    </main>
  );
}
