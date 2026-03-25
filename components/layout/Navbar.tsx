"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassButton } from "@/components/ui/GlassButton";
import { signOut } from "@/lib/actions/auth";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Portfolio", href: "/portfolio" },
  { name: "Watchlist", href: "/watchlist" },
  { name: "Alerts", href: "/alerts" },
  { name: "DCA Scheduler", href: "/dca" },
  { name: "Dividends", href: "/dividends" },
  { name: "Target Planner", href: "/planner" },
  { name: "Income Planner", href: "/income" },
  { name: "Allocation", href: "/allocation" },
  { name: "Cash to Lot", href: "/cash-to-lot" },
  { name: "Mutual Funds", href: "/mutual-funds" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#0f0f23]/80 backdrop-blur-xl border-b border-white/10">
        <nav className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="font-bold text-white">Invest Tracker</span>
          </div>

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
          <div className="px-4 pb-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/settings"
              className="block px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </Link>
            <form action={signOut} className="pt-2 border-t border-white/10">
              <button
                type="submit"
                className="w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Desktop Logout Button */}
      <header className="hidden lg:flex fixed top-4 right-4 z-50">
        <form action={signOut}>
          <GlassButton type="submit" variant="ghost" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </GlassButton>
        </form>
      </header>
    </>
  );
}
