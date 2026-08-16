"use client";

import { useMemo } from "react";
import { APPLIANCE_MAP } from "@/lib/loads";
import type { ApplianceSelection } from "@/lib/rab";
import { useI18n } from "@/lib/i18n/provider";
import { formatNumber } from "@/lib/format";

/**
 * Grafik batang horizontal (CSS murni, tanpa library) pemakaian energi harian
 * per peralatan — sinkron dengan pilihan di AppliancePicker.
 */
export function EnergyChart({
  appliances,
}: {
  appliances: Record<string, ApplianceSelection>;
}) {
  const { t, lang } = useI18n();

  const rows = useMemo(() => {
    const list = Object.entries(appliances)
      .map(([code, sel]) => {
        const def = APPLIANCE_MAP.get(code);
        if (!def || sel.qty <= 0 || sel.hours <= 0) return null;
        return {
          name: lang === "id" ? def.nameId : def.nameEn,
          watts: def.watts,
          qty: sel.qty,
          hours: sel.hours,
          dailyWh: Math.round(def.watts * sel.hours * sel.qty),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    return list.sort((a, b) => b.dailyWh - a.dailyWh);
  }, [appliances, lang]);

  const maxWh = Math.max(...rows.map((r) => r.dailyWh), 1);
  const totalWh = rows.reduce((s, r) => s + r.dailyWh, 0);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900">📊 {t.configurator.energyChart}</h3>
        <p className="mt-2 text-sm text-slate-400">{t.configurator.noAppliances}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">📊 {t.configurator.energyChart}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{t.configurator.energyChartHint}</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t.configurator.dailyEnergy}
          </div>
          <div className="text-lg font-extrabold text-slate-900">
            {formatNumber(totalWh)} Wh
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-slate-700">
                {r.name}
                <span className="ml-1.5 text-slate-400">
                  {r.watts}W ×{r.qty} ({r.hours}j)
                </span>
              </span>
              <span className="shrink-0 font-bold text-slate-800">
                {formatNumber(r.dailyWh)} Wh
              </span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300"
                style={{ width: `${Math.max(3, (r.dailyWh / maxWh) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
