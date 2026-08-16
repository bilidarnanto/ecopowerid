"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDateTime, formatIDR } from "@/lib/format";

type Quote = {
  id: string;
  reference: string;
  name: string;
  email: string;
  vehicleType: string;
  status: string;
  totals: { total?: number };
  createdAt: string;
};

const STATUSES = ["SEMUA", "BARU", "DITINJAU", "DISETUJUI", "DITOLAK"] as const;

export default function AdminPenawaranPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Quote[] | null>(null);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("SEMUA");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/quotes?status=${filter}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setItems(data.quotes);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const statusLabel: Record<string, string> = {
    BARU: t.admin.quoteStatusBaru,
    DITINJAU: t.admin.quoteStatusDitinjau,
    DISETUJUI: t.admin.quoteStatusDisetujui,
    DITOLAK: t.admin.quoteStatusDitolak,
  };

  const badge: Record<string, string> = {
    BARU: "bg-blue-100 text-blue-700",
    DITINJAU: "bg-amber-100 text-amber-700",
    DISETUJUI: "bg-emerald-100 text-emerald-700",
    DITOLAK: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">{t.admin.quotesTitle}</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === s
                ? "bg-emerald-600 text-white"
                : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {s === "SEMUA" ? t.common.all : statusLabel[s]}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">{t.pdf.quoteRef}</th>
              <th className="px-4 py-3">{t.quote.name}</th>
              <th className="px-4 py-3">{t.quote.email}</th>
              <th className="px-4 py-3">{t.pdf.vehicle}</th>
              <th className="px-4 py-3 text-right">{t.rab.totalLabel}</th>
              <th className="px-4 py-3">{t.admin.submittedAt}</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">{t.common.loading}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">{t.admin.noQuotes}</td></tr>
            ) : (
              items.map((q) => (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/penawaran/${q.id}`} className="font-bold text-emerald-700 hover:underline">
                      {q.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{q.name}</td>
                  <td className="px-4 py-3 text-slate-600">{q.email}</td>
                  <td className="px-4 py-3 text-slate-600">{q.vehicleType}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatIDR(q.totals?.total ?? 0)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(q.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge[q.status] ?? badge.BARU}`}>
                      {statusLabel[q.status] ?? q.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
