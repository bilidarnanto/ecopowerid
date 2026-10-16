"use client";

import type { PltsResult } from "@/lib/plts";
import type { LocationInfo } from "@/lib/solar-data";
import { useI18n } from "@/lib/i18n/provider";
import { formatNumber } from "@/lib/format";

export function PltsSummary({
  plts,
  location,
}: {
  plts: PltsResult;
  location?: LocationInfo | null;
}) {
  const { t, lang } = useI18n();

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

  // Hitung estimasi produksi energi berdasarkan lokasi
  const psh = location?.avgPeakSunHours ?? plts.input.sunHours ?? 4.5;
  const derating = 0.75; // efisiensi sistem
  const dailyKwh = (plts.panelTotalWp * psh * derating) / 1000;
  const monthlyKwh = dailyKwh * 30;
  const annualKwh = dailyKwh * 365;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{t.plts.resultsTitle}</h3>

      {/* Info lokasi jika tersedia */}
      {location && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            📍 {location.cityName}
            {location.province && (
              <span className="font-normal text-emerald-600">
                — {location.province}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-emerald-700">
            <span>
              ☀️ {t.solar.peakSunHours}: <b>{psh} {t.solar.hoursPerDay}</b>
            </span>
            <span>
              {location.source === "api" ? "📡 Live Data" : "📊 Estimasi"}
            </span>
          </div>
        </div>
      )}

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

      {/* Estimasi produksi energi */}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
          ☀️ {t.solar.solarPotential}
        </div>
        <p className="mt-0.5 text-xs text-amber-600">
          {t.solar.solarPotentialDesc}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-3 text-center">
            <div className="text-xs text-slate-500">{t.solar.dailyGeneration}</div>
            <div className="text-lg font-extrabold text-amber-600">
              {formatNumber(dailyKwh, 1)} kWh
            </div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center">
            <div className="text-xs text-slate-500">{t.solar.monthlyGeneration}</div>
            <div className="text-lg font-extrabold text-amber-600">
              {formatNumber(monthlyKwh, 0)} kWh
            </div>
          </div>
          <div className="rounded-lg bg-white p-3 text-center">
            <div className="text-xs text-slate-500">{t.solar.annualGeneration}</div>
            <div className="text-lg font-extrabold text-emerald-600">
              {formatNumber(annualKwh, 0)} kWh
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-amber-700">
          <span>
            {t.solar.specificYield}:{" "}
            <b>{(psh * derating * 1000).toFixed(0)} {t.solar.kwhPerKwpPerDay}</b>
          </span>
          <span>
            Panel: {plts.panelTotalWp} Wp ÷ {psh} PSH × {derating} derating
          </span>
        </div>
      </div>
    </div>
  );
}
