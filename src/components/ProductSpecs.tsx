"use client";

import { useMemo } from "react";
import {
  VEHICLE_CONFIGS,
  EXTERIOR_COLOR_MAP,
  INTERIOR_COLOR_MAP,
  DEFAULT_EXTERIOR_COLOR,
  DEFAULT_INTERIOR_COLOR,
  type VehicleType,
} from "@/lib/configurator-data";
import {
  formatSpecs,
  type CatalogComponent,
  type RabLine,
} from "@/lib/rab";
import type { Dict } from "@/lib/i18n/dictionaries";
import { formatIDR, formatNumber } from "@/lib/format";

type ProductSpecsProps = {
  vehicleType: VehicleType;
  packageCode: string | null;
  layoutCode: string | null;
  materialCode: string | null;
  addonCodes: string[];
  includePlts: boolean;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  catalog: CatalogComponent[];
  lines: RabLine[];
  weightKg: number;
  productionDays: number;
  warrantyMonths: number;
  t: Dict;
  lang: "id" | "en";
};

/** Panel Spesifikasi Produk Akhir — tampil di step 4 review */
export function ProductSpecs(props: ProductSpecsProps) {
  const {
    vehicleType,
    packageCode,
    layoutCode,
    materialCode,
    addonCodes,
    includePlts,
    exteriorColor,
    interiorColor,
    catalog,
    lines,
    weightKg,
    productionDays,
    warrantyMonths,
    t,
    lang,
  } = props;

  const vehicle = VEHICLE_CONFIGS.find((v) => v.type === vehicleType);
  const isPlts = vehicleType === "plts";

  const lookup = useMemo(
    () => (code: string) => catalog.find((c) => c.code === code),
    [catalog]
  );

  // Gather specs from selected components
  const packageSpecs = useMemo(() => {
    const pkg = packageCode ? lookup(packageCode) : null;
    return pkg?.specs ?? null;
  }, [packageCode, lookup]);

  const layoutSpecs = useMemo(() => {
    const lay = layoutCode ? lookup(layoutCode) : null;
    return lay?.specs ?? null;
  }, [layoutCode, lookup]);

  const addonSpecs = useMemo(() => {
    return addonCodes
      .map((code) => {
        const comp = lookup(code);
        if (!comp) return null;
        return { code: comp.code, nameId: comp.nameId, nameEn: comp.nameEn, specs: comp.specs };
      })
      .filter(Boolean) as { code: string; nameId: string; nameEn: string; specs: Record<string, unknown> | null }[];
  }, [addonCodes, lookup]);

  const pltsLines = useMemo(() => {
    return lines.filter((l) => l.group === "PLTS");
  }, [lines]);

  const extColor = EXTERIOR_COLOR_MAP.get(exteriorColor ?? DEFAULT_EXTERIOR_COLOR);
  const intColor = INTERIOR_COLOR_MAP.get(interiorColor ?? DEFAULT_INTERIOR_COLOR);

  // Capacity from layout specs
  const capacity = typeof layoutSpecs?.capacity === "number" ? layoutSpecs.capacity : null;
  const bedSize = typeof layoutSpecs?.bedSize === "string" ? layoutSpecs.bedSize : null;

  // Warranty from package
  const warrantyM = warrantyMonths;

  // Highlight features
  const highlights: string[] = [];
  if (vehicle) highlights.push(lang === "id" ? vehicle.descId : vehicle.descEn);
  if (bedSize) highlights.push(lang === "id" ? `Tempat tidur ${bedSize}` : `Bed size ${bedSize}`);
  if (capacity) highlights.push(lang === "id" ? `Kapasitas ${capacity} orang` : `Capacity for ${capacity} people`);
  if (addonCodes.includes("CV-AD-AC") || addonCodes.includes("MH-AD-AC"))
    highlights.push(lang === "id" ? "Pendingin udara (AC)" : "Air conditioning (AC)");
  if (addonCodes.includes("CV-AD-FRIDGE") || addonCodes.includes("MH-AD-FRIDGE"))
    highlights.push(lang === "id" ? "Kulkas 12V" : "12V Fridge");
  if (addonCodes.includes("CV-AD-WATERHEATER") || addonCodes.includes("MH-AD-WATERHEATER"))
    highlights.push(lang === "id" ? "Pemanas air" : "Water heater");
  if (includePlts) highlights.push(lang === "id" ? "Sistem tenaga surya mandiri" : "Independent solar power system");
  if (addonCodes.includes("CV-AD-AWNING") || addonCodes.includes("MH-AD-AWNING") || addonCodes.includes("FT-AD-AWNING"))
    highlights.push(lang === "id" ? "Awning (teras lipat)" : "Retractable awning");
  if (addonCodes.includes("MH-AD-SMART"))
    highlights.push(lang === "id" ? "Sistem smart home" : "Smart home system");
  if (addonCodes.includes("FT-AD-SIGN"))
    highlights.push(lang === "id" ? "Papan nama LED" : "LED signage board");

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        📋 {t.configurator.productSpecsTitle}
      </h3>
      <p className="mt-1 text-xs text-slate-500">{t.configurator.productSpecsSubtitle}</p>

      {/* Main specs grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SpecCard
          icon="🚐"
          label={t.configurator.specVehicleType}
          value={vehicle ? (lang === "id" ? vehicle.labelId : vehicle.labelEn) : "—"}
          detail={vehicle ? (lang === "id" ? vehicle.descId : vehicle.descEn) : undefined}
        />
        {packageCode && (
          <SpecCard
            icon="📦"
            label={t.configurator.specPackage}
            value={lookup(packageCode)?.[lang === "id" ? "nameId" : "nameEn"] ?? packageCode}
            specs={formatSpecs(packageSpecs, lang)}
          />
        )}
        {layoutCode && !isPlts && (
          <SpecCard
            icon="🪑"
            label={t.configurator.specLayout}
            value={lookup(layoutCode)?.[lang === "id" ? "nameId" : "nameEn"] ?? layoutCode}
            specs={formatSpecs(layoutSpecs, lang)}
          />
        )}
        {materialCode && !isPlts && (
          <SpecCard
            icon="🪵"
            label={t.configurator.specMaterial}
            value={lookup(materialCode)?.[lang === "id" ? "nameId" : "nameEn"] ?? materialCode}
          />
        )}
        {!isPlts && (
          <>
            <SpecCard
              icon="🎨"
              label={t.configurator.specExteriorColor}
              value={extColor ? (lang === "id" ? extColor.labelId : extColor.labelEn) : "—"}
              swatch={extColor?.swatch}
            />
            <SpecCard
              icon="🛋️"
              label={t.configurator.specInteriorColor}
              value={intColor ? (lang === "id" ? intColor.labelId : intColor.labelEn) : "—"}
              swatch={intColor?.swatch}
            />
          </>
        )}
        {capacity !== null && capacity > 0 && (
          <SpecCard
            icon="👥"
            label={t.configurator.specCapacity}
            value={`${capacity} ${lang === "id" ? "orang" : "people"}`}
          />
        )}
        {bedSize && (
          <SpecCard
            icon="🛏️"
            label={t.configurator.specBedSize}
            value={bedSize}
          />
        )}
        {weightKg > 0 && (
          <SpecCard
            icon="⚖️"
            label={t.configurator.specWeight}
            value={`≈ ${formatNumber(weightKg)} kg`}
          />
        )}
        {productionDays > 0 && (
          <SpecCard
            icon="⏱️"
            label={t.configurator.specWorkDays}
            value={`≈ ${productionDays} ${lang === "id" ? "hari kerja" : "work days"}`}
          />
        )}
        {warrantyM > 0 && (
          <SpecCard
            icon="🛡️"
            label={t.configurator.specWarranty}
            value={`${warrantyM} ${lang === "id" ? "bulan" : "months"}`}
          />
        )}
      </div>

      {/* Add-ons detail */}
      {addonSpecs.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-bold text-slate-700">{t.configurator.specAddons}</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {addonSpecs.map((addon) => {
              const chips = formatSpecs(addon.specs, lang);
              return (
                <div
                  key={addon.code}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3"
                >
                  <span className="mt-0.5 text-sm">⚡</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800">
                      {lang === "id" ? addon.nameId : addon.nameEn}
                    </div>
                    {chips.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {chips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PLTS summary */}
      {includePlts && pltsLines.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-bold text-slate-700">☀️ {t.configurator.specPlts}</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {pltsLines.map((line) => {
              const chips = formatSpecs(line.specs, lang);
              return (
                <div
                  key={line.id}
                  className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3"
                >
                  <span className="mt-0.5 text-sm">☀️</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800">
                      {lang === "id" ? line.nameId : line.nameEn}
                      {line.qty > 1 && <span className="ml-1 text-slate-500">×{line.qty}</span>}
                    </div>
                    {chips.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {chips.map((chip) => (
                          <span
                            key={chip}
                            className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <h4 className="text-sm font-bold text-emerald-800">✨ {t.configurator.specHighlight}</h4>
          <ul className="mt-2 space-y-1">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-xs leading-relaxed text-emerald-700">
                <span className="mt-0.5 shrink-0">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Kartu spesifikasi individual */
function SpecCard({
  icon,
  label,
  value,
  detail,
  specs,
  swatch,
}: {
  icon: string;
  label: string;
  value: string;
  detail?: string;
  specs?: string[];
  swatch?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            {swatch && (
              <span
                className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-300"
                style={{ backgroundColor: swatch }}
              />
            )}
            <span className="text-sm font-bold text-slate-900">{value}</span>
          </div>
          {detail && (
            <div className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</div>
          )}
          {specs && specs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {specs.map((chip) => (
                <span
                  key={chip}
                  className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
