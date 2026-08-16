"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { formatIDR, formatDate } from "@/lib/format";

type Component = {
  id: string;
  code: string;
  nameId: string;
  nameEn: string;
  category: string;
  unit: string;
  price: number;
  specs: Record<string, unknown> | null;
  isActive: boolean;
  priceUpdatedAt: string;
};

const CATEGORIES = [
  "STRUKTUR",
  "INTERIOR",
  "PERALATAN",
  "PLTS_PANEL",
  "PLTS_BATTERY",
  "PLTS_INVERTER",
  "PLTS_SCC",
  "PLTS_BOS",
  "LISTRIK",
  "PLUMBING",
  "JASA",
];

type FormState = {
  code: string;
  nameId: string;
  nameEn: string;
  category: string;
  unit: string;
  price: string;
  specs: string;
};

const EMPTY: FormState = { code: "", nameId: "", nameEn: "", category: "PERALATAN", unit: "unit", price: "", specs: "" };

export default function AdminKomponenPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Component[] | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/components");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.components);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/components");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setItems(data.components);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.nameId.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q)
    );
  }, [items, search]);

  async function save() {
    if (!editing) return;
    setError(null);
    const price = Number(editing.price);
    if (!editing.code || !editing.nameId || !editing.nameEn || !editing.unit || !(price > 0)) {
      setError("Lengkapi semua field wajib (kode, nama ID/EN, satuan, harga > 0).");
      return;
    }
    let specs: Record<string, unknown> | null = null;
    if (editing.specs.trim()) {
      try {
        specs = JSON.parse(editing.specs);
      } catch {
        setError("Spesifikasi bukan JSON valid. Contoh: {\"wp\": 450}");
        return;
      }
    }
    setSaving(true);
    try {
      const isNew = !items?.some((c) => c.code === editing.code);
      const res = await fetch(
        isNew ? "/api/admin/components" : `/api/admin/components/${editing.code}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: editing.code,
            nameId: editing.nameId,
            nameEn: editing.nameEn,
            category: editing.category,
            unit: editing.unit,
            price,
            specs,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menyimpan");
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Component) {
    await fetch(`/api/admin/components/${c.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    load();
  }

  async function remove(c: Component) {
    if (!window.confirm(t.common.confirmDelete)) return;
    await fetch(`/api/admin/components/${c.code}`, { method: "DELETE" });
    load();
  }

  function startEdit(c: Component) {
    setEditing({
      code: c.code,
      nameId: c.nameId,
      nameEn: c.nameEn,
      category: c.category,
      unit: c.unit,
      price: String(c.price),
      specs: c.specs ? JSON.stringify(c.specs) : "",
    });
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{t.admin.components}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items ? `${items.length} item · harga dalam IDR` : "Memuat..."}
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
        >
          + {t.admin.addComponent}
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.admin.searchPlaceholder}
        className="mt-4 w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">{t.admin.componentNameId}</th>
              <th className="px-4 py-3">{t.admin.category}</th>
              <th className="px-4 py-3">{t.admin.unit}</th>
              <th className="px-4 py-3 text-right">{t.admin.price}</th>
              <th className="px-4 py-3">{t.admin.active}</th>
              <th className="px-4 py-3 text-right">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.code} className={`border-b border-slate-50 hover:bg-slate-50 ${!c.isActive ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{c.code}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800">{c.nameId}</div>
                  <div className="text-xs text-slate-400">{c.nameEn}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">
                    Update: {formatDate(c.priceUpdatedAt)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {c.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.unit}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatIDR(c.price)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {c.isActive ? "ON" : "OFF"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(c)} className="mr-2 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                    ✏️ {t.common.edit}
                  </button>
                  <button onClick={() => remove(c)} className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {items === null ? t.common.loading : "Tidak ada komponen."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              {items?.some((c) => c.code === editing.code) ? t.admin.editComponent : t.admin.addComponent}
            </h3>

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Kode *</span>
                  <input
                    value={editing.code}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                    placeholder="CONTOH-01"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">{t.admin.category} *</span>
                  <select
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">{t.admin.componentNameId} *</span>
                <input
                  value={editing.nameId}
                  onChange={(e) => setEditing({ ...editing, nameId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">{t.admin.componentNameEn} *</span>
                <input
                  value={editing.nameEn}
                  onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">{t.admin.unit} *</span>
                  <input
                    value={editing.unit}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    placeholder="unit / set / meter"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">{t.admin.price} *</span>
                  <input
                    type="number"
                    min={0}
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                    placeholder="1000000"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">{t.admin.specs}</span>
                <textarea
                  value={editing.specs}
                  onChange={(e) => setEditing({ ...editing, specs: e.target.value })}
                  rows={2}
                  placeholder='{"wp": 450}'
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? `${t.common.loading}...` : t.common.save}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
