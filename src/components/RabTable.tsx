"use client";

import { useMemo } from "react";
import { RAB_GROUPS, formatSpecs, type Rab } from "@/lib/rab";
import { formatIDR, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

const GROUP_LABEL_KEY: Record<(typeof RAB_GROUPS)[number], keyof typeof import("@/lib/i18n/dictionaries").id.rab> = {
  STRUKTUR: "groupStruktur",
  INTERIOR: "groupInterior",
  PERALATAN: "groupPeralatan",
  PLTS: "groupPlts",
  LISTRIK: "groupListrik",
  PLUMBING: "groupPlumbing",
  JASA: "groupJasa",
};

export function RabTable({ rab, compact = false }: { rab: Rab; compact?: boolean }) {
  const { t, lang } = useI18n();

  const groups = useMemo(
    () =>
      RAB_GROUPS.map((g) => ({
        key: g,
        label: t.rab[GROUP_LABEL_KEY[g]],
        lines: rab.lines.filter((l) => l.group === g),
      })).filter((g) => g.lines.length > 0),
    [rab.lines, t.rab]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      {/* Header */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
        <h3 className="text-lg font-bold text-slate-900">Rencana Anggaran Biaya</h3>
        <p className="mt-0.5 text-sm text-slate-500">Detail komponen & estimasi biaya proyek</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 w-12">{t.rab.no}</th>
              <th className="px-4 py-3">{t.rab.item}</th>
              <th className="px-4 py-3">{t.rab.spec}</th>
              <th className="px-4 py-3 text-right w-20">{t.rab.qty}</th>
              <th className="px-4 py-3 text-right w-28">{t.rab.price}</th>
              <th className="px-4 py-3 text-right w-32">{t.rab.subtotal}</th>
            </tr>
          </thead>
          {groups.map((g, gi) => (
            <tbody key={g.key}>
              <tr className={"border-b border-slate-100 " + (gi % 2 === 0 ? "bg-emerald-50/40" : "bg-sky-50/30")}>
                <td colSpan={6} className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-[10px] font-bold text-white">
                      {gi + 1}
                    </span>
                    <span className="text-sm font-bold text-emerald-800">
                      {g.label}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      {g.lines.length} item
                    </span>
                  </span>
                </td>
              </tr>
              {g.lines.map((l, i) => {
                const specChips = formatSpecs(l.specs, lang);
                return (
                  <tr key={l.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3 text-center text-slate-400 text-xs">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {lang === "id" ? l.nameId : l.nameEn}
                      </div>
                      {l.code && (
                        <span className="text-[11px] text-slate-400 font-mono">{l.code}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {l.spec && <div className="mb-1 text-xs text-slate-600">{l.spec}</div>}
                      {specChips.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {specChips.map((chip) => (
                            <span
                              key={chip}
                              className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {l.qty.toLocaleString("id-ID")} <span className="text-slate-400">{l.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {formatIDR(l.price)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800">
                      {formatIDR(l.subtotal)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <td colSpan={5} className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                  Subtotal {g.label}
                </td>
                <td className="px-4 py-2 text-right text-sm font-bold tabular-nums text-slate-700">
                  {formatIDR(g.lines.reduce((s, l) => s + l.subtotal, 0))}
                </td>
              </tr>
            </tbody>
          ))}
          <tfoot>
            {rab.totals.weightKg > 0 && (
              <tr className="border-t border-slate-100">
                <td colSpan={5} className="px-4 py-2 text-right text-xs text-slate-500">
                  Estimasi Berat Total
                </td>
                <td className="px-4 py-2 text-right text-sm font-medium tabular-nums text-slate-600">
                  ≈ {formatNumber(rab.totals.weightKg)} kg
                </td>
              </tr>
            )}
            <tr className="border-t-2 border-slate-200">
              <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                {t.rab.subtotalLabel}
              </td>
              <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-slate-800">
                {formatIDR(rab.totals.subtotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right text-sm text-slate-500">
                {t.rab.marginLabel} ({rab.totals.marginPct}%)
              </td>
              <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-600">
                {formatIDR(rab.totals.margin)}
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="px-4 py-2 text-right text-sm text-slate-500">
                {t.rab.ppnLabel} ({rab.totals.ppnPct}%)
              </td>
              <td className="px-4 py-2 text-right text-sm tabular-nums text-slate-600">
                {formatIDR(rab.totals.ppn)}
              </td>
            </tr>
            <tr className="border-t-2 border-emerald-600 bg-gradient-to-r from-emerald-50 to-teal-50">
              <td colSpan={5} className="px-4 py-4 text-right">
                <span className="text-lg font-extrabold uppercase tracking-wide text-emerald-800">
                  {t.rab.totalLabel}
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="text-xl font-extrabold tabular-nums text-emerald-700">
                  {formatIDR(rab.totals.total)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!compact && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
          <p className="text-xs text-slate-400 italic">{t.rab.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
