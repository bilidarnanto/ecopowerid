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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-300 bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
            <th className="px-3 py-2">{t.rab.no}</th>
            <th className="px-3 py-2">{t.rab.item}</th>
            <th className="px-3 py-2">{t.rab.spec}</th>
            <th className="px-3 py-2 text-right">{t.rab.qty}</th>
            <th className="px-3 py-2 text-right">{t.rab.price}</th>
            <th className="px-3 py-2 text-right">{t.rab.subtotal}</th>
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody key={g.key}>
            <tr className="border-b border-slate-200 bg-emerald-50/70">
              <td colSpan={6} className="px-3 py-2 font-bold text-emerald-800">
                {g.label}
              </td>
            </tr>
            {g.lines.map((l, i) => {
              const specChips = formatSpecs(l.specs, lang);
              return (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {lang === "id" ? l.nameId : l.nameEn}
                    {l.code && (
                      <span className="ml-1 text-[11px] text-slate-400">({l.code})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {l.spec && <div className="mb-0.5 text-slate-600">{l.spec}</div>}
                    {specChips.length > 0 && (
                      <span className="flex flex-wrap gap-1">
                        {specChips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                          >
                            {chip}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {l.qty.toLocaleString("id-ID")} {l.unit}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">{formatIDR(l.price)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800">
                    {formatIDR(l.subtotal)}
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-slate-200 bg-slate-50/70">
              <td colSpan={5} className="px-3 py-1.5 text-right text-xs font-semibold text-slate-500">
                {t.rab.subtotalLabel} {g.label}
              </td>
              <td className="px-3 py-1.5 text-right text-sm font-bold text-slate-700">
                {formatIDR(g.lines.reduce((s, l) => s + l.subtotal, 0))}
              </td>
            </tr>
          </tbody>
        ))}
        <tfoot>
          {rab.totals.weightKg > 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-1 text-right text-slate-600">
                {t.rab.weightTotalLabel}
              </td>
              <td className="px-3 py-1 text-right font-semibold text-slate-700">
                ≈ {formatNumber(rab.totals.weightKg)} kg
              </td>
            </tr>
          )}
          <tr className="border-t-2 border-slate-300">
            <td colSpan={5} className="px-3 py-2 text-right text-slate-600">{t.rab.subtotalLabel}</td>
            <td className="px-3 py-2 text-right font-semibold">{formatIDR(rab.totals.subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={5} className="px-3 py-1 text-right text-slate-600">
              {t.rab.marginLabel} ({rab.totals.marginPct}%)
            </td>
            <td className="px-3 py-1 text-right text-slate-700">{formatIDR(rab.totals.margin)}</td>
          </tr>
          <tr>
            <td colSpan={5} className="px-3 py-1 text-right text-slate-600">
              {t.rab.ppnLabel} ({rab.totals.ppnPct}%)
            </td>
            <td className="px-3 py-1 text-right text-slate-700">{formatIDR(rab.totals.ppn)}</td>
          </tr>
          <tr className="border-t-2 border-emerald-600 bg-emerald-50">
            <td colSpan={5} className="px-3 py-2.5 text-right text-base font-extrabold text-emerald-800">
              {t.rab.totalLabel}
            </td>
            <td className="px-3 py-2.5 text-right text-base font-extrabold text-emerald-800">
              {formatIDR(rab.totals.total)}
            </td>
          </tr>
        </tfoot>
      </table>
      {!compact && (
        <p className="mt-3 text-xs text-slate-500">{t.rab.disclaimer}</p>
      )}
    </div>
  );
}
