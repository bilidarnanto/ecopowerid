"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";

const STATUSES = ["BARU", "DITINJAU", "DISETUJUI", "DITOLAK"] as const;

export function StatusUpdater({
  id,
  current,
  labels,
}: {
  id: string;
  current: string;
  labels: Record<string, string>;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      window.alert(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-emerald-500"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {labels[s] ?? s}
          </option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={saving || value === current}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? "..." : t.common.save}
      </button>
    </div>
  );
}
