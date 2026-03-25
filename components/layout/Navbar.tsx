"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils/cn";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Portfolio", href: "/dashboard/portfolio" },
  { name: "Daftar Pantau", href: "/dashboard/watchlist" },
  { name: "Peringatan", href: "/dashboard/alerts" },
  { name: "Jadwal DCA", href: "/dashboard/dca" },
  { name: "Dividen", href: "/dashboard/dividends" },
  { name: "Alokasi", href: "/dashboard/allocation" },
  { name: "Reksa Dana", href: "/dashboard/mutual-funds" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#0f0f23] border-b border-white/10">
        <nav className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">InvestTrack</span>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            className="p-2 rounded-lg text-white/60 hover:text-gray-700 hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="px-3 pb-4 space-y-0.5">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-green-500/10 text-green-400 border-l-[3px] border-green-500 pl-[10px]"
                      : "text-white/50 hover:text-gray-700 hover:bg-white/5 border-l-[3px] border-transparent pl-[10px]"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-white/10 space-y-0.5">
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-gray-700 hover:bg-white/5 transition-colors border-l-[3px] border-transparent pl-[10px]"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pengaturan
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-colors border-l-[3px] border-transparent pl-[10px]"
                >
                  Keluar
                </button>
              </form>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
