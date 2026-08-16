"use client";

import type { PltsResult } from "@/lib/plts";
import { useI18n } from "@/lib/i18n/provider";
import { formatNumber } from "@/lib/format";

export function PltsSummary({ plts }: { plts: PltsResult }) {
  const { t } = useI18n();

  const cards = [
    {
      label: t.plts.panelLabel,
      icon: "🔆",
      detail: `${t.plts.panelDetail}: ${formatNumber(plts.panelWpPerUnit)} Wp × ${plts.panelQty}`,
      value: `${formatNumber(plts.panelTotalWp)} Wp`,
      accent: "border-amber-300 bg-amber-50",
    },
    {
      label: t.plts.batteryLabel,
      icon: "🔋",
      detail: `${t.plts.batteryDetail}: ${formatNumber(plts.batteryAhPerUnit)} Ah × ${plts.batteryQty}`,
      value: `${formatNumber(plts.batteryTotalWh / 1000, 1)} kWh (${plts.batteryVoltage}V)`,
      accent: "border-emerald-300 bg-emerald-50",
    },
    {
      label: t.plts.inverterLabel,
      icon: "⚡",
      detail: t.plts.inverterDetail,
      value: `${formatNumber(plts.inverterW)} W`,
      accent: "border-sky-300 bg-sky-50",
    },
    {
      label: t.plts.sccLabel,
      icon: "🔧",
      detail: t.plts.sccDetail,
      value: `${formatNumber(plts.sccA)} A`,
      accent: "border-violet-300 bg-violet-50",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{t.plts.resultsTitle}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border-2 p-4 ${c.accent}`}>
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-2 text-sm font-semibold text-slate-700">{c.label}</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">{c.value}</div>
            <div className="mt-1 text-xs text-slate-500">{c.detail}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-slate-100 pt-4 text-sm">
        <span className="text-slate-600">
          {t.plts.dailyTotal}:{" "}
          <b className="text-slate-900">{formatNumber(plts.dailyWh)} Wh</b>
        </span>
        <span className="text-slate-600">
          {t.plts.peakLoad}:{" "}
          <b className="text-slate-900">{formatNumber(plts.peakW)} W</b>
        </span>
        <span className="text-slate-600">
          {t.plts.autonomy}:{" "}
          <b className="text-slate-900">{plts.input.autonomyDays ?? 2} hari</b>
        </span>
      </div>
    </div>
  );
}
