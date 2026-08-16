"use client";

import { useEffect, useMemo, useState } from "react";
import {
  VEHICLE_CONFIGS,
  EXTERIOR_COLORS,
  INTERIOR_COLORS,
  EXTERIOR_COLOR_MAP,
  INTERIOR_COLOR_MAP,
  DEFAULT_EXTERIOR_COLOR,
  DEFAULT_INTERIOR_COLOR,
  getPackageCompare,
  type ConfigGroup,
  type VehicleConfig,
  type VehicleType,
} from "@/lib/configurator-data";
import {
  deserializeConfig,
  serializeConfig,
  shareUrl,
} from "@/lib/config-share";
import {
  buildRab,
  buildProvider,
  energyFromState,
  type ApplianceSelection,
  type CatalogComponent,
  type ConfiguratorState,
  type Rab,
} from "@/lib/rab";
import type { Dict } from "@/lib/i18n/dictionaries";
import { calculatePlts } from "@/lib/plts";
import { APPLIANCE_MAP } from "@/lib/loads";
import { useI18n } from "@/lib/i18n/provider";
import { formatIDR, formatNumber } from "@/lib/format";
import { AppliancePicker } from "@/components/AppliancePicker";
import { PltsSummary } from "@/components/PltsSummary";
import { RabTable } from "@/components/RabTable";
import { RabPdfButton } from "@/components/RabPdfButton";
import { QuoteModal } from "@/components/QuoteModal";
import { VehicleSketch } from "@/components/VehicleSketch";
import { PackageCompareModal } from "@/components/PackageCompareModal";
import { EnergyChart } from "@/components/EnergyChart";

const STORAGE_KEY = "ecopower-config-v1";

const STEP_KEYS = ["stepVehicle", "stepPackage", "stepOptions", "stepEnergy", "stepReview"] as const;

export default function ConfiguratorPage() {
  const { t, lang } = useI18n();

  const [catalog, setCatalog] = useState<CatalogComponent[] | null>(null);
  const [step, setStep] = useState(0);
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [packageCode, setPackageCode] = useState<string | null>(null);
  const [layoutCode, setLayoutCode] = useState<string | null>(null);
  const [materialCode, setMaterialCode] = useState<string | null>(null);
  const [addonCodes, setAddonCodes] = useState<string[]>([]);
  const [appliances, setAppliances] = useState<Record<string, ApplianceSelection>>({});
  const [includePlts, setIncludePlts] = useState(true);
  const [manualDailyWh, setManualDailyWh] = useState<number | null>(null);
  const [manualPeakW, setManualPeakW] = useState<number | null>(null);
  const [exteriorColor, setExteriorColor] = useState<string>(DEFAULT_EXTERIOR_COLOR);
  const [interiorColor, setInteriorColor] = useState<string>(DEFAULT_INTERIOR_COLOR);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [restoredFromLink, setRestoredFromLink] = useState(false);
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);
  // Guard: autosave tidak boleh menimpa localStorage sebelum restore selesai
  const [ready, setReady] = useState(false);

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

  const state: ConfiguratorState = {
    vehicleType: vehicleType ?? "campervan",
    packageCode,
    layoutCode,
    materialCode,
    addonCodes,
    appliances,
    includePlts,
    manualDailyWh: manualDailyWh ?? undefined,
    manualPeakW: manualPeakW ?? undefined,
    exteriorColor,
    interiorColor,
  };

  // ------------------------------------------------------------------
  // Simpan & bagikan konfigurasi
  // ------------------------------------------------------------------

  // Autosave ke localStorage setiap ada perubahan (setelah restore pertama)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, serializeConfig(state, step));
    } catch {
      // localStorage tidak tersedia — abaikan
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready,
    vehicleType,
    packageCode,
    layoutCode,
    materialCode,
    addonCodes,
    appliances,
    includePlts,
    manualDailyWh,
    manualPeakW,
    exteriorColor,
    interiorColor,
    step,
  ]);

  // Muat ulang: prioritas URL share (?c=...) > localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("c");
    let restored = false;
    if (shared) {
      const parsed = deserializeConfig(shared);
      if (parsed) {
        applyConfig(parsed.config, parsed.step);
        restored = true;
        setRestoredFromLink(true);
        // Bersihkan query agar tidak mengganggu navigasi berikutnya
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
    if (!restored) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = deserializeConfig(saved);
          if (parsed) {
            applyConfig(parsed.config, parsed.step);
            restored = true;
            setRestoredFromStorage(true);
          }
        }
      } catch {
        // abaikan
      }
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyConfig(cfg: ConfiguratorState, s: number) {
    setVehicleType(cfg.vehicleType);
    setPackageCode(cfg.packageCode ?? null);
    setLayoutCode(cfg.layoutCode ?? null);
    setMaterialCode(cfg.materialCode ?? null);
    setAddonCodes(cfg.addonCodes ?? []);
    setAppliances(cfg.appliances ?? {});
    setIncludePlts(cfg.includePlts);
    setManualDailyWh(cfg.manualDailyWh ?? null);
    setManualPeakW(cfg.manualPeakW ?? null);
    setExteriorColor(cfg.exteriorColor ?? DEFAULT_EXTERIOR_COLOR);
    setInteriorColor(cfg.interiorColor ?? DEFAULT_INTERIOR_COLOR);
    setStep(s);
  }

  function handleShare() {
    try {
      void navigator.clipboard.writeText(shareUrl(state, step));
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      // clipboard tidak tersedia
    }
  }

  const rab = useMemo(() => {
    if (!provider) return null;
    return buildRab(state, provider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, packageCode, layoutCode, materialCode, addonCodes, appliances, includePlts, manualDailyWh, manualPeakW, vehicleType]);

  const pltsResult = useMemo(() => {
    if (!provider) return null;
    if (!includePlts && vehicleType !== "plts") return null;
    const energy = energyFromState(state);
    if (energy.dailyWh <= 0 || energy.peakW <= 0) return null;
    return calculatePlts({ dailyWh: energy.dailyWh, peakW: energy.peakW }, provider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, includePlts, vehicleType, appliances, manualDailyWh, manualPeakW]);

  const vehicle = vehicleType ? VEHICLE_CONFIGS.find((v) => v.type === vehicleType) : null;
  const isPltsOnly = vehicleType === "plts";
  const compare = vehicleType ? getPackageCompare(vehicleType) : null;

  // Estimasi waktu produksi: paket konversi mendominasi (hari kerja terbesar)
  const productionDays = useMemo(() => {
    if (!rab) return 0;
    return Math.max(
      0,
      ...rab.lines.map((l) =>
        typeof l.specs?.workDays === "number" ? (l.specs.workDays as number) : 0
      )
    );
  }, [rab]);

  // Garansi: ambil garansi paket (STRUKTUR) bila ada, fallback maksimum antar komponen
  const warrantyMonths = useMemo(() => {
    if (!rab) return 0;
    const pkg = rab.lines.find(
      (l) =>
        l.group === "STRUKTUR" &&
        typeof l.specs?.warrantyMonths === "number"
    );
    if (pkg) return pkg.specs!.warrantyMonths as number;
    return Math.max(
      0,
      ...rab.lines.map((l) =>
        typeof l.specs?.warrantyMonths === "number"
          ? (l.specs.warrantyMonths as number)
          : 0
      )
    );
  }, [rab]);

  function selectVehicle(v: VehicleType) {
    setVehicleType(v);
    setPackageCode(null);
    setLayoutCode(null);
    setMaterialCode(null);
    setAddonCodes([]);
    setAppliances({});
    setStep(v === "plts" ? 2 : 1);
  }

  function toggleAddon(code: string) {
    setAddonCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  // Validasi: langkah paket/layout/material wajib lengkap sebelum lanjut
  const stepComplete =
    step !== 1 || Boolean(packageCode && layoutCode && materialCode);

  function next() {
    if (!stepComplete) return;
    if (step === 0) setStep(isPltsOnly ? 3 : 1);
    else if (step < 4) setStep(step + 1);
  }

  function restart() {
    setStep(0);
    setVehicleType(null);
    setPackageCode(null);
    setLayoutCode(null);
    setMaterialCode(null);
    setAddonCodes([]);
    setAppliances({});
    setIncludePlts(true);
    setManualDailyWh(null);
    setManualPeakW(null);
    setExteriorColor(DEFAULT_EXTERIOR_COLOR);
    setInteriorColor(DEFAULT_INTERIOR_COLOR);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // abaikan
    }
  }

  const stepLabels = STEP_KEYS.map((k) => t.configurator[k]);

  const groupValue = (key: string) =>
    key === "package" ? packageCode : key === "layout" ? layoutCode : materialCode;
  const groupSetter = (key: string, code: string) => {
    if (key === "package") setPackageCode(code);
    else if (key === "layout") setLayoutCode(code);
    else setMaterialCode(code);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        {t.configurator.title}
      </h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t.configurator.subtitle}</p>

      {(restoredFromLink || restoredFromStorage) && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <span>
            💾{" "}
            {restoredFromLink
              ? t.configurator.restoredFromLink
              : t.configurator.restoredFromStorage}
          </span>
          <button
            onClick={() => {
              setRestoredFromLink(false);
              setRestoredFromStorage(false);
            }}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-sky-600 hover:bg-sky-100"
          >
            {t.common.close}
          </button>
        </div>
      )}

      {/* Progress */}
      <ol className="mt-8 flex flex-wrap items-center gap-2">
        {stepLabels.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i === step
                  ? "bg-emerald-600 text-white"
                  : i < step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span
              className={`text-xs font-semibold ${
                i === step ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {label}
            </span>
            {i < stepLabels.length - 1 && <span className="text-slate-300">—</span>}
          </li>
        ))}
      </ol>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Pratinjau 3D — sticky di kanan (desktop), di atas (mobile) */}
        <aside className="order-first lg:order-none">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                {t.configurator.preview}
              </h2>
              <span className="text-lg" aria-hidden>
                {vehicle?.emoji ?? "🛠️"}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{t.configurator.previewHint}</p>
            <div className="mt-4">
              <VehicleSketch
                vehicleType={vehicleType}
                packageCode={packageCode}
                layoutCode={layoutCode}
                materialCode={materialCode}
                addonCodes={addonCodes}
                includePlts={includePlts}
                exteriorColor={exteriorColor}
                interiorColor={interiorColor}
              />
            </div>

            {vehicle && vehicleType !== "plts" && (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                {/* Warna eksterior */}
                <div>
                  <div className="text-xs font-semibold text-slate-600">
                    {t.configurator.exteriorColor}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {EXTERIOR_COLORS.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        title={lang === "id" ? c.labelId : c.labelEn}
                        aria-label={`${lang === "id" ? c.labelId : c.labelEn}${exteriorColor === c.code ? ` (${t.configurator.selected})` : ""}`}
                        onClick={() => setExteriorColor(c.code)}
                        className={`h-7 w-7 rounded-full border-2 transition-all ${
                          exteriorColor === c.code
                            ? "scale-110 border-emerald-600 ring-2 ring-emerald-200"
                            : "border-slate-300 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.swatch }}
                      />
                    ))}
                  </div>
                </div>
                {/* Warna interior */}
                <div>
                  <div className="text-xs font-semibold text-slate-600">
                    {t.configurator.interiorColor}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {INTERIOR_COLORS.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        title={lang === "id" ? c.labelId : c.labelEn}
                        aria-label={`${lang === "id" ? c.labelId : c.labelEn}${interiorColor === c.code ? ` (${t.configurator.selected})` : ""}`}
                        onClick={() => setInteriorColor(c.code)}
                        className={`h-7 w-7 rounded-full border-2 transition-all ${
                          interiorColor === c.code
                            ? "scale-110 border-emerald-600 ring-2 ring-emerald-200"
                            : "border-slate-300 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.swatch }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {vehicle && (
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="font-semibold text-slate-700">
                  {vehicle.emoji} {lang === "id" ? vehicle.labelId : vehicle.labelEn}
                </div>
                <div className="mt-1 space-y-0.5">
                  {packageCode && <div>{t.configurator.basePackage}: {packageCode}</div>}
                  {layoutCode && <div>{t.configurator.layout}: {layoutCode}</div>}
                  {materialCode && <div>{t.configurator.material}: {materialCode}</div>}
                  {addonCodes.length > 0 && (
                    <div>
                      {t.configurator.addOns}: {addonCodes.length}×
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Total berjalan — live selama konfigurasi */}
            {rab && step > 0 && (
              <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t.configurator.liveTotal}
                </div>
                <div className="mt-1 text-2xl font-extrabold text-emerald-400">
                  {formatIDR(rab.totals.total)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-2 text-[11px] text-slate-300">
                  <span>
                    {t.rab.subtotalLabel}: {formatIDR(rab.totals.subtotal)}
                  </span>
                  {rab.totals.weightKg > 0 && (
                    <span>
                      {t.configurator.estimatedWeight}: ≈{" "}
                      {formatNumber(rab.totals.weightKg)} {t.configurator.weightSuffix}
                    </span>
                  )}
                  {productionDays > 0 && (
                    <span>
                      ⏱️ {t.configurator.productionTime}: ≈ {productionDays}{" "}
                      {t.configurator.workDaysUnit}
                    </span>
                  )}
                  {warrantyMonths > 0 && (
                    <span>
                      🛡️ {t.configurator.warranty}: {warrantyMonths}{" "}
                      {t.configurator.monthsUnit}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tombol bagikan konfigurasi */}
            {step > 0 && vehicle && (
              <button
                type="button"
                onClick={handleShare}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                {shareCopied ? (
                  <>✅ {t.configurator.shareCopied}</>
                ) : (
                  <>
                    🔗 {t.configurator.share}
                    <span className="hidden text-[10px] font-normal text-slate-400 sm:inline">
                      {t.configurator.shareHint}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </aside>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* STEP 0 — TIPE KENDARAAN */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t.configurator.selectVehicle}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {VEHICLE_CONFIGS.map((v) => (
                <button
                  key={v.type}
                  onClick={() => selectVehicle(v.type)}
                  className="group rounded-2xl border-2 border-slate-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
                >
                  <div className="text-4xl">{v.emoji}</div>
                  <div className="mt-3 text-base font-bold text-slate-900">
                    {lang === "id" ? v.labelId : v.labelEn}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-500">
                    {lang === "id" ? v.descId : v.descEn}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
                    {t.configurator.next} →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1 — PAKET, LAYOUT, MATERIAL */}
        {step === 1 && vehicle && (
          <div className="space-y-8">
            {vehicle.groups
              .filter((g) => g.key !== "addons")
              .map((g) => (
                <div key={g.key}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {lang === "id" ? g.labelId : g.labelEn}
                    </h3>
                    {g.key === "package" && compare && (
                      <button
                        onClick={() => setCompareOpen(true)}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        ⚖️ {t.configurator.comparePackages}
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {g.options.map((opt) => {
                      const selected = groupValue(g.key) === opt.code;
                      const comp = provider?.byCode(opt.code);
                      // Selisih vs opsi dasar grup (opsi pertama = paket dasar)
                      const baseCode = g.options[0]?.code;
                      const baseComp = baseCode ? provider?.byCode(baseCode) : undefined;
                      const delta =
                        comp && baseComp ? comp.price - baseComp.price : null;
                      return (
                        <button
                          key={opt.code}
                          onClick={() => groupSetter(g.key, opt.code)}
                          className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {lang === "id" ? opt.labelId : opt.labelEn}
                            </span>
                            {selected && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
                                ✓
                              </span>
                            )}
                          </div>
                          {opt.descId && (
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                              {lang === "id" ? opt.descId : opt.descEn}
                            </p>
                          )}
                          {comp && (
                            <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                              <div className="text-sm font-bold text-slate-800">
                                {formatIDR(comp.price)}
                              </div>
                              {delta === 0 && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                  {t.configurator.basePackageShort}
                                </span>
                              )}
                              {delta !== null && delta > 0 && (
                                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  +{formatIDR(delta)}
                                </span>
                              )}
                              {delta !== null && delta < 0 && (
                                <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                                  −{formatIDR(-delta)}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* STEP 2 — TAMBAHAN (ADD-ONS) */}
        {step === 2 && vehicle && (
          <div>
            {vehicle.groups
              .filter((g) => g.key === "addons")
              .map((g) => (
                <div key={g.key}>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === "id" ? g.labelId : g.labelEn}
                  </h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {g.options.map((opt) => {
                      const selected = addonCodes.includes(opt.code);
                      const comp = provider?.byCode(opt.code);
                      return (
                        <button
                          key={opt.code}
                          onClick={() => toggleAddon(opt.code)}
                          className={`rounded-xl border-2 p-4 text-left transition-all ${
                            selected
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {lang === "id" ? opt.labelId : opt.labelEn}
                            </span>
                            {selected && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white">
                                ✓
                              </span>
                            )}
                          </div>
                          {opt.descId && (
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                              {lang === "id" ? opt.descId : opt.descEn}
                            </p>
                          )}
                          {comp && (
                            <div className="mt-2 border-t border-slate-100 pt-2">
                              <div className="text-sm font-bold text-slate-800">
                                {formatIDR(comp.price)}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* STEP 3 — KEBUTUHAN ENERGI */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t.configurator.appliances}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.configurator.appliancesHint}</p>

            {isPltsOnly && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-bold text-slate-700">
                  {t.plts.manualDailyWh} {t.common.optional}
                </h3>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
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
              </div>
            )}

            <div className="mt-5">
              <AppliancePicker value={appliances} onChange={setAppliances} />
            </div>

            {/* Grafik pemakaian energi — bar chart langsung saat pilih peralatan */}
            <div className="mt-5">
              <EnergyChart appliances={appliances} />
            </div>

            {!isPltsOnly && (
              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={includePlts}
                  onChange={(e) => setIncludePlts(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="text-sm font-semibold text-slate-800">
                  ☀️ {t.configurator.systemSummary}
                </span>
              </label>
            )}

            {/* Sizing PLTS live — muncul langsung saat pilih peralatan */}
            {pltsResult && (
              <div className="mt-5">
                <PltsSummary plts={pltsResult} />
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — RINGKASAN & RAB */}
        {step === 4 && rab && (
          <div className="space-y-6">
            {/* Rincian per bagian — biar customer paham kemana uangnya */}
            <SectionBreakdown rab={rab} t={t} lang={lang} />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">{t.configurator.summaryTitle}</h3>
              <div className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {vehicle && (
                  <div>
                    <span className="text-slate-500">{t.configurator.stepVehicle}: </span>
                    <b className="text-slate-800">
                      {vehicle.emoji} {lang === "id" ? vehicle.labelId : vehicle.labelEn}
                    </b>
                  </div>
                )}
                {packageCode && (
                  <SummaryItem
                    label={t.configurator.basePackage}
                    code={packageCode}
                    catalog={catalog}
                    lang={lang}
                  />
                )}
                {layoutCode && (
                  <SummaryItem
                    label={t.configurator.layout}
                    code={layoutCode}
                    catalog={catalog}
                    lang={lang}
                  />
                )}
                {materialCode && (
                  <SummaryItem
                    label={t.configurator.material}
                    code={materialCode}
                    catalog={catalog}
                    lang={lang}
                  />
                )}
                {addonCodes.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">{t.configurator.addOns}: </span>
                    <b className="text-slate-800">
                      {addonCodes
                        .map((c) => {
                          const comp = catalog?.find((x) => x.code === c);
                          return comp ? (lang === "id" ? comp.nameId : comp.nameEn) : c;
                        })
                        .join(", ")}
                    </b>
                  </div>
                )}
                {Object.keys(appliances).length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">{t.configurator.appliances}: </span>
                    <b className="text-slate-800">
                      {Object.entries(appliances)
                        .map(([code, sel]) => {
                          const app = APPLIANCE_MAP.get(code);
                          return app
                            ? `${lang === "id" ? app.nameId : app.nameEn} ×${sel.qty} (${sel.hours}j)`
                            : code;
                        })
                        .join(", ")}
                    </b>
                  </div>
                )}
                {vehicleType !== "plts" && (
                  <>
                    <div>
                      <span className="text-slate-500">{t.configurator.exteriorColor}: </span>
                      <b className="text-slate-800">
                        {lang === "id"
                          ? EXTERIOR_COLOR_MAP.get(exteriorColor)?.labelId
                          : EXTERIOR_COLOR_MAP.get(exteriorColor)?.labelEn}
                      </b>
                    </div>
                    <div>
                      <span className="text-slate-500">{t.configurator.interiorColor}: </span>
                      <b className="text-slate-800">
                        {lang === "id"
                          ? INTERIOR_COLOR_MAP.get(interiorColor)?.labelId
                          : INTERIOR_COLOR_MAP.get(interiorColor)?.labelEn}
                      </b>
                    </div>
                  </>
                )}
              </div>
            </div>

            {(productionDays > 0 || warrantyMonths > 0) && (
              <div className="flex flex-wrap gap-2">
                {productionDays > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    ⏱️ {t.configurator.productionTime}: ≈ {productionDays}{" "}
                    {t.configurator.workDaysUnit}
                  </span>
                )}
                {warrantyMonths > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    🛡️ {t.configurator.warranty}: {warrantyMonths}{" "}
                    {t.configurator.monthsUnit}
                  </span>
                )}
              </div>
            )}

            {pltsResult && <PltsSummary plts={pltsResult} />}

            <div>
              <h3 className="mb-3 text-lg font-bold text-slate-900">{t.configurator.rabTitle}</h3>
              <RabTable rab={rab} />
            </div>

            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-slate-900 px-6 py-5 sm:flex-row">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {t.configurator.estimatedTotal}
                </div>
                <div className="text-3xl font-extrabold text-emerald-400">
                  {formatIDR(rab.totals.total)}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <RabPdfButton
                  rab={rab}
                  meta={{
                    vehicleLabel: vehicle ? (lang === "id" ? vehicle.labelId : vehicle.labelEn) : undefined,
                  }}
                />
                <button
                  onClick={() => setQuoteOpen(true)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  📨 {t.configurator.requestQuote}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* NAVIGASI */}
      {step > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep(step - 1)}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            ← {t.configurator.back}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={restart}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              ↺ {t.configurator.restart}
            </button>
            {step < 4 && (
              <div className="flex flex-col items-end gap-1.5">
                {!stepComplete && (
                  <span className="text-xs font-medium text-amber-600">
                    {t.configurator.requiredHint}
                  </span>
                )}
                <button
                  onClick={next}
                  disabled={!stepComplete}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {t.configurator.next} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <QuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        vehicleType={vehicleType ?? "campervan"}
        config={state}
      />

      {compare && (
        <PackageCompareModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          vehicleType={vehicleType ?? "campervan"}
          compare={compare}
          onSelect={(code) => {
            setPackageCode(code);
            setCompareOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SummaryItem({
  label,
  code,
  catalog,
  lang,
}: {
  label: string;
  code: string;
  catalog: CatalogComponent[] | null;
  lang: "id" | "en";
}) {
  const comp = catalog?.find((c) => c.code === code);
  if (!comp) return null;
  return (
    <div>
      <span className="text-slate-500">{label}: </span>
      <b className="text-slate-800">{lang === "id" ? comp.nameId : comp.nameEn}</b>
    </div>
  );
}

/** Rincian RAB per bagian (grup) — subtotal & proporsi, biar customer paham kemana uangnya */
function SectionBreakdown({
  rab,
  t,
  lang,
}: {
  rab: Rab;
  t: Dict;
  lang: "id" | "en";
}) {
  const groups = useMemo(() => {
    const totals = new Map<string, number>();
    for (const l of rab.lines) {
      totals.set(l.group, (totals.get(l.group) ?? 0) + l.subtotal);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [rab.lines]);

  const total = groups.reduce((s, [, v]) => s + v, 0);
  if (groups.length === 0) return null;

  const labelKey: Record<string, string> = {
    STRUKTUR: t.rab.groupStruktur,
    INTERIOR: t.rab.groupInterior,
    PERALATAN: t.rab.groupPeralatan,
    PLTS: t.rab.groupPlts,
    LISTRIK: t.rab.groupListrik,
    PLUMBING: t.rab.groupPlumbing,
    JASA: t.rab.groupJasa,
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-bold text-slate-900">🧩 {t.configurator.sectionBreakdown}</h3>
      <div className="mt-3 space-y-2.5">
        {groups.map(([group, subtotal]) => (
          <div key={group}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-slate-700">
                {labelKey[group] ?? group}
              </span>
              <span className="font-bold text-slate-800">
                {formatIDR(subtotal)}
                <span className="ml-1 font-normal text-slate-400">
                  ({total > 0 ? Math.round((subtotal / total) * 100) : 0}%)
                </span>
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500/80 transition-all duration-300"
                style={{ width: `${total > 0 ? (subtotal / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
