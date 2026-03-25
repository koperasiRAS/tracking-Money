"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

  // Jika belum login, middleware sudah redirect ke /auth/register
  // Halaman ini hanya untuk user yang sudah login (dashboard cepat)
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full text-center space-y-8 animate-in">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white">
            Selamat Datang!
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            {user?.email}
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
