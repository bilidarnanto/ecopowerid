"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildProvider,
  buildPltsRab,
  energyFromState,
  type ApplianceSelection,
  type CatalogComponent,
  type ConfiguratorState,
} from "@/lib/rab";
import { calculatePlts } from "@/lib/plts";
import { PLTS_PRESETS } from "@/lib/configurator-data";
import { useI18n } from "@/lib/i18n/provider";
import { formatIDR } from "@/lib/format";
import { AppliancePicker } from "@/components/AppliancePicker";
import { PltsSummary } from "@/components/PltsSummary";
import { RabTable } from "@/components/RabTable";
import { RabPdfButton } from "@/components/RabPdfButton";
import { QuoteModal } from "@/components/QuoteModal";

export default function PltsPage() {
  const { t, lang } = useI18n();

  const [catalog, setCatalog] = useState<CatalogComponent[] | null>(null);
  const [appliances, setAppliances] = useState<Record<string, ApplianceSelection>>({});
  const [manualDailyWh, setManualDailyWh] = useState<number | null>(null);
  const [manualPeakW, setManualPeakW] = useState<number | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setCatalog(d.components);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const provider = useMemo(
    () => (catalog ? buildProvider(catalog) : null),
    [catalog]
  );

  const configState: ConfiguratorState = {
    vehicleType: "plts",
    packageCode: null,
    layoutCode: null,
    materialCode: null,
    addonCodes: [],
    appliances,
    includePlts: true,
    manualDailyWh: manualDailyWh ?? undefined,
    manualPeakW: manualPeakW ?? undefined,
  };

  const energy = energyFromState(configState);

  const plts = useMemo(() => {
    if (!provider || energy.dailyWh <= 0 || energy.peakW <= 0) return null;
    return calculatePlts(
      { dailyWh: energy.dailyWh, peakW: energy.peakW },
      provider
    );
  }, [provider, energy.dailyWh, energy.peakW]);

  const rab = useMemo(() => (plts ? buildPltsRab(plts) : null), [plts]);

  function applyPreset(dailyWh: number, peakW: number) {
    setManualDailyWh(dailyWh);
    setManualPeakW(peakW);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        ☀️ {t.plts.title}
      </h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t.plts.subtitle}</p>

      {/* Preset */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {t.plts.stepLoads}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PLTS_PRESETS.map((p) => (
            <button
              key={p.code}
              onClick={() => applyPreset(p.dailyWh, p.peakW)}
              className={`rounded-xl border-2 px-4 py-3 text-left transition-all ${
                manualDailyWh === p.dailyWh
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-sm font-bold text-slate-900">
                {lang === "id" ? p.labelId : p.labelEn}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                ~{(p.dailyWh / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} kWh/hari
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">{t.plts.manualDailyWh}</span>
            <input
              type="number"
              min={0}
              value={manualDailyWh ?? ""}
              onChange={(e) => setManualDailyWh(e.target.value ? Number(e.target.value) : null)}
              placeholder="mis. 4000"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">{t.plts.manualPeakW}</span>
            <input
              type="number"
              min={0}
              value={manualPeakW ?? ""}
              onChange={(e) => setManualPeakW(e.target.value ? Number(e.target.value) : null)}
              placeholder="mis. 2500"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
          </label>
        </div>

        <div className="mt-5">
          <AppliancePicker value={appliances} onChange={setAppliances} />
        </div>
      </div>

      {/* Hasil */}
      {plts && rab && (
        <div className="mt-6 space-y-6">
          <PltsSummary plts={plts} />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-slate-900">{t.plts.rabTitle}</h3>
            <RabTable rab={rab} />
          </div>

          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-900 px-6 py-5 sm:flex-row">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {t.plts.totalLabel}
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {formatIDR(rab.totals.total)}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <RabPdfButton rab={rab} />
              <button
                onClick={() => setQuoteOpen(true)}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                📨 {t.configurator.requestQuote}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500">{t.plts.note}</p>
        </div>
      )}

      <QuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        vehicleType="plts"
        config={configState}
      />
    </div>
  );
}
