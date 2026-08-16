"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { PackageCompare, VehicleType } from "@/lib/configurator-data";

export function PackageCompareModal({
  open,
  onClose,
  vehicleType,
  compare,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  vehicleType: VehicleType;
  compare: PackageCompare;
  onSelect: (code: string) => void;
}) {
  const { t, lang } = useI18n();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t.configurator.packageFeatures}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {t.configurator.comparePackages}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={t.common.close}
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto px-5 py-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.configurator.featureColumn}
                </th>
                {compare.tiers.map((tier) => (
                  <th
                    key={tier.key}
                    className="px-2 py-2 text-center text-xs font-bold text-slate-700"
                  >
                    {lang === "id" ? tier.labelId : tier.labelEn}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compare.features.map((f) => (
                <tr key={f.featureId} className="border-b border-slate-100">
                  <td className="px-2 py-2.5 font-medium text-slate-800">
                    {lang === "id" ? f.labelId : f.labelEn}
                  </td>
                  {compare.tiers.map((tier) => {
                    const included = f.tiers[tier.key] === true;
                    return (
                      <td key={tier.key} className="px-2 py-2.5 text-center">
                        {included ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.common.close}
          </button>
          {compare.tiers.map((tier) => (
            <button
              key={tier.key}
              onClick={() => {
                onSelect(tier.codePrefix);
                onClose();
              }}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              {t.configurator.selected}: {lang === "id" ? tier.labelId : tier.labelEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
