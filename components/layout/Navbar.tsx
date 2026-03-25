"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

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

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-base/80 backdrop-blur-xl border-b border-white/10">
        <nav className="flex items-center justify-between px-4 py-3">
          <span className="font-bold text-white">Invest Tracker</span>

          <button
            type="button"
            aria-label="Toggle menu"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
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
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 space-y-0.5">
              <Link
                href="/dashboard/settings"
                className="block px-4 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pengaturan
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
