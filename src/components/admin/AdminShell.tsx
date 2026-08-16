"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { siteConfig } from "@/lib/site-config";

const NAV = [
  { href: "/admin", key: "dashboard", icon: "📊" },
  { href: "/admin/komponen", key: "components", icon: "🧩" },
  { href: "/admin/harga", key: "prices", icon: "🤖" },
  { href: "/admin/penawaran", key: "quotes", icon: "📨" },
  { href: "/admin/galeri", key: "gallery", icon: "🖼️" },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex-1 space-y-1">
      {NAV.map((n) => {
        const active = pathname === n.href || pathname.startsWith(n.href + "/");
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-emerald-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>{n.icon}</span>
            {t.admin[n.key]}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-slate-900 p-4 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white">
            ☀️
          </span>
          <span className="font-bold text-white">{siteConfig.name}</span>
        </Link>
        {nav}
        <div className="mt-4 space-y-1 border-t border-slate-800 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <span>🏠</span>
            {t.nav.home}
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <span>🚪</span>
            {t.admin.logout}
          </button>
        </div>
      </aside>

      {/* Top bar mobile */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-slate-900 px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-base text-white">
            ☀️
          </span>
          <span className="font-bold text-white">{siteConfig.name}</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-20 bg-slate-900/95 pt-14 lg:hidden">
          <div className="p-4">{nav}</div>
        </div>
      )}

      <main className="flex-1 px-4 pb-10 pt-20 sm:px-6 lg:ml-60 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
