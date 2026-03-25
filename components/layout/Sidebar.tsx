"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { signOut } from "@/lib/actions/auth";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Portfolio", href: "/dashboard/portfolio" },
  { name: "Daftar Pantau", href: "/dashboard/watchlist" },
  { name: "Peringatan", href: "/dashboard/alerts" },
  { name: "Jadwal DCA", href: "/dashboard/dca" },
  { name: "Dividen", href: "/dashboard/dividends" },
  { name: "Perencana Target", href: "/dashboard/planner" },
  { name: "Perencana Pendapatan", href: "/dashboard/income" },
  { name: "Alokasi", href: "/dashboard/allocation" },
  { name: "Uang ke Lot", href: "/dashboard/cash-to-lot" },
  { name: "Meter Risiko", href: "/dashboard/risk-meter" },
  { name: "Skor Bulanan", href: "/dashboard/score" },
  { name: "Reksa Dana", href: "/dashboard/mutual-funds" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0f0f23] border-r border-white/10">
      {/* Logo */}
      <div className="px-6 py6 border-b border-white/10">
        <span className="font-bold text-lg text-white">Invest Tracker</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        <Link
          href="/dashboard/settings"
          className="block px-4 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all duration-150"
        >
          Pengaturan
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
