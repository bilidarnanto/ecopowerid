"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { formatDate, formatIDR } from "@/lib/format";

type Suggestion = {
  id: string;
  source: string;
  suggestedPrice: number;
  rangeLow: number | null;
  rangeHigh: number | null;
  reasoning: string | null;
  status: string;
  createdAt: string;
  component: {
    code: string;
    nameId: string;
    nameEn: string;
    category: string;
    price: number;
  };
};

export default function AdminHargaPage() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/prices");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.suggestions);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/prices");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setItems(data.suggestions);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function run() {
    setRunning(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/prices", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      setMessage(`✅ ${data.created} saran baru dibuat.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghubungi AI");
    } finally {
      setRunning(false);
    }
  }

  async function review(id: string, action: "approve" | "reject") {
    setError(null);
    try {
      const res = await fetch(`/api/admin/prices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses");
    }
  }

  const pending = items?.filter((s) => s.status === "PENDING") ?? [];
  const history = items?.filter((s) => s.status !== "PENDING") ?? [];

  const badge = (status: string) =>
    status === "PENDING"
      ? "bg-amber-100 text-amber-700"
      : status === "APPROVED"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-slate-100 text-slate-500";

  const statusLabel = (status: string) =>
    status === "PENDING"
      ? t.admin.statusPending
      : status === "APPROVED"
        ? t.admin.statusApproved
        : t.admin.statusRejected;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">🤖 {t.admin.prices}</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">{t.admin.aiSubtitle}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={run}
          disabled={running}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {running ? `${t.admin.aiRunning}...` : t.admin.aiRun}
        </button>
        {message && <span className="text-sm font-semibold text-emerald-600">{message}</span>}
        {error && <span className="text-sm font-semibold text-red-600">{error}</span>}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠️ {t.admin.aiSubtitle}
      </div>

      {/* Menunggu */}
      <h2 className="mt-8 text-lg font-bold text-slate-900">
        {t.admin.statusPending} ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {t.admin.aiNoSuggestions}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {pending.map((s) => (
            <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-bold text-slate-500">{s.component.code}</span>
                <span className="font-semibold text-slate-800">
                  {lang === "id" ? s.component.nameId : s.component.nameEn}
                </span>
                <span className="ml-auto text-xs text-slate-400">{formatDate(s.createdAt)}</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t.admin.current}</div>
                  <div className="mt-0.5 font-bold text-slate-700">{formatIDR(s.component.price)}</div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-emerald-600">{t.admin.suggested}</div>
                  <div className="mt-0.5 font-extrabold text-emerald-800">{formatIDR(s.suggestedPrice)}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500">{t.admin.range}</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-700">
                    {s.rangeLow != null ? formatIDR(s.rangeLow) : "—"} – {s.rangeHigh != null ? formatIDR(s.rangeHigh) : "—"}
                  </div>
                </div>
              </div>
              {s.reasoning && (
                <p className="mt-2 text-xs italic text-slate-500">💡 {s.reasoning}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => review(s.id, "approve")}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  ✓ {t.admin.approve}
                </button>
                <button
                  onClick={() => review(s.id, "reject")}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ✕ {t.admin.reject}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Riwayat */}
      {history.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold text-slate-900">Riwayat ({history.length})</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3 text-right">{t.admin.current}</th>
                  <th className="px-4 py-3 text-right">{t.admin.suggested}</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">{t.admin.submittedAt}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{s.component.code}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {lang === "id" ? s.component.nameId : s.component.nameEn}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{formatIDR(s.component.price)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{formatIDR(s.suggestedPrice)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badge(s.status)}`}>
                        {statusLabel(s.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
