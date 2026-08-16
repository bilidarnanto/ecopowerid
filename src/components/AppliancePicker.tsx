"use client";

import { APPLIANCES } from "@/lib/loads";
import type { ApplianceSelection } from "@/lib/rab";
import { useI18n } from "@/lib/i18n/provider";
import { formatNumber } from "@/lib/format";

export function AppliancePicker({
  value,
  onChange,
}: {
  value: Record<string, ApplianceSelection>;
  onChange: (v: Record<string, ApplianceSelection>) => void;
}) {
  const { t, lang } = useI18n();

  function setSel(code: string, sel: ApplianceSelection | null) {
    const next = { ...value };
    if (sel === null) delete next[code];
    else next[code] = sel;
    onChange(next);
  }

  const totalWh = Object.entries(value).reduce((sum, [code, sel]) => {
    const def = APPLIANCES.find((a) => a.code === code);
    if (!def) return sum;
    return sum + def.watts * sel.hours * sel.qty;
  }, 0);

  return (
    <div>
      <div className="space-y-2">
        {APPLIANCES.map((app) => {
          const sel = value[app.code];
          const checked = Boolean(sel);
          return (
            <div
              key={app.code}
              className={`flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors sm:flex-nowrap ${
                checked ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white"
              }`}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const def = APPLIANCES.find((a) => a.code === app.code)!;
                      setSel(app.code, { qty: 1, hours: def.hours });
                    } else {
                      setSel(app.code, null);
                    }
                  }}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                  {lang === "id" ? app.nameId : app.nameEn}
                </span>
                <span className="ml-auto shrink-0 text-xs text-slate-400">
                  {app.watts} W
                </span>
              </label>
              {checked && (
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 text-slate-600">
                    <span>×</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={sel!.qty}
                      onChange={(e) =>
                        setSel(app.code, { ...sel!, qty: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-center outline-none focus:border-emerald-500"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-slate-600">
                    <span>{t.configurator.hoursPerDay}</span>
                    <input
                      type="number"
                      min={0.5}
                      max={24}
                      step={0.5}
                      value={sel!.hours}
                      onChange={(e) =>
                        setSel(app.code, { ...sel!, hours: Math.min(24, Math.max(0.5, Number(e.target.value) || 0.5)) })
                      }
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center outline-none focus:border-emerald-500"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
        <span className="text-sm font-medium text-slate-300">
          {t.configurator.dailyEnergy}
        </span>
        <span className="text-lg font-extrabold text-emerald-400">
          {formatNumber(Math.round(totalWh))} Wh/hari
        </span>
      </div>
    </div>
  );
}
