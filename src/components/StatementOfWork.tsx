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
import { type CatalogComponent, type RabLine } from "@/lib/rab";
import { formatSpecs } from "@/lib/rab";
import { buildWorkSchedule, type WorkSchedule } from "@/lib/work-schedule";
import { buildAdvancedRabBreakdown, type AdvancedCostBreakdown } from "@/lib/rab";
import type { ConfiguratorState } from "@/lib/rab";
import type { Dict } from "@/lib/i18n/dictionaries";
import { formatIDR } from "@/lib/format";

type StatementOfWorkProps = {
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
  state: ConfiguratorState;
  advancedBreakdown: AdvancedCostBreakdown;
  productionDays: number;
  warrantyMonths: number;
  t: Dict;
  lang: "id" | "en";
};

/** Panel Statement of Work (SOW) — dokumen acuan proyek */
export function StatementOfWork(props: StatementOfWorkProps) {
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
    state,
    advancedBreakdown,
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

  const schedule: WorkSchedule = useMemo(
    () => buildWorkSchedule(vehicleType, lines, includePlts, addonCodes, lang),
    [vehicleType, lines, includePlts, addonCodes, lang]
  );

  const totalWeeks = Math.ceil(schedule.totalDays / 7);
  const grandTotal = advancedBreakdown.grandTotal;
  const dpAmount = Math.round(grandTotal * 0.4); // 40% DP
  const progressAmount = Math.round(grandTotal * 0.4); // 40% progress
  const finalAmount = grandTotal - dpAmount - progressAmount; // 20% final

  // Exclusions based on vehicle type
  const exclusions: string[] = useMemo(() => {
    const exc: string[] = [];
    if (isPlts) {
      exc.push(
        lang === "id" ? "Kendaraan / unit dasar" : "Base vehicle / unit",
        lang === "id" ? "Biaya parkir / penyimpanan kendaraan" : "Vehicle parking / storage fees",
      );
    } else {
      exc.push(
        lang === "id" ? "Kendaraan (van/bus/truk basis)" : "Base vehicle (van/bus/truck)",
        lang === "id" ? "Asuransi kendaraan" : "Vehicle insurance",
        lang === "id" ? "Biaya STNK / registrasi" : "STNK / registration fees",
      );
      if (!includePlts) {
        exc.push(lang === "id" ? "Sistem PLTS" : "Solar power system");
      }
    }
    exc.push(
      lang === "id" ? "Modifikasi mesin / drivetrain" : "Engine / drivetrain modifications",
      lang === "id" ? "Aksesori eksterior non-fungsional (decal, stiker, dll)" : "Non-functional exterior accessories (decals, stickers, etc.)",
      lang === "id" ? "Biaya pengiriman kendaraan ke lokasi tujuan" : "Vehicle delivery to destination",
    );
    return exc;
  }, [isPlts, includePlts, lang]);

  // Inclusions
  const inclusions: string[] = useMemo(() => {
    const inc: string[] = [];
    inc.push(
      lang === "id" ? "Seluruh material & komponen sesuai RAB" : "All materials & components as per RAB",
      lang === "id" ? "Jasa tenaga kerja bengkel bersertifikat" : "Certified workshop labor",
      lang === "id" ? "Instalasi kelistrikan & sanitasi" : "Electrical & plumbing installation",
    );
    if (includePlts || isPlts) {
      inc.push(
        lang === "id" ? "Instalasi penuh sistem PLTS" : "Full solar power system installation",
        lang === "id" ? "Pengujian & komisi sistem energi" : "Energy system testing & commissioning",
      );
    }
    inc.push(
      lang === "id" ? `Garansi kerja ${warrantyMonths} bulan` : `${warrantyMonths} months workmanship warranty`,
      lang === "id" ? "Panduan pemeliharaan & operasional" : "Maintenance & operations guide",
      lang === "id" ? "Dukungan teknis pasca-serah terima" : "Post-handover technical support",
    );
    return inc;
  }, [includePlts, isPlts, warrantyMonths, lang]);

  // Milestones
  const milestones = useMemo(() => {
    const ms: { label: string; day: number }[] = [];
    let day = 0;

    const activeSteps = schedule.steps.filter((s) => s.active);
    for (const step of activeSteps) {
      day += step.durationDays;
      if ([2, 3, 5, 7, 8].includes(step.id)) {
        ms.push({
          label: lang === "id" ? step.titleId : step.titleEn,
          day,
        });
      }
    }
    return ms;
  }, [schedule, lang]);

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            📄 {t.configurator.sowTitle}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{t.configurator.sowSubtitle}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-right">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Est. Total</div>
          <div className="text-lg font-extrabold text-emerald-400">{formatIDR(grandTotal)}</div>
        </div>
      </div>

      {/* --- 1. Project Scope --- */}
      <SowSection icon="🎯" title={t.configurator.sowProjectScope} desc={t.configurator.sowProjectScopeDesc}>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ScopeItem
            icon={vehicle?.emoji ?? "🛠️"}
            label={t.configurator.specVehicleType}
            value={vehicle ? (lang === "id" ? vehicle.labelId : vehicle.labelEn) : "—"}
            lang={lang}
          />
          {packageCode && (
            <ScopeItem
              icon="📦"
              label={t.configurator.specPackage}
              value={lookup(packageCode)?.[lang === "id" ? "nameId" : "nameEn"] ?? packageCode}
              specs={formatSpecs(lookup(packageCode)?.specs, lang)}
              lang={lang}
            />
          )}
          {layoutCode && !isPlts && (
            <ScopeItem
              icon="🪑"
              label={t.configurator.specLayout}
              value={lookup(layoutCode)?.[lang === "id" ? "nameId" : "nameEn"] ?? layoutCode}
              specs={formatSpecs(lookup(layoutCode)?.specs, lang)}
              lang={lang}
            />
          )}
          {materialCode && !isPlts && (
            <ScopeItem
              icon="🪵"
              label={t.configurator.specMaterial}
              value={lookup(materialCode)?.[lang === "id" ? "nameId" : "nameEn"] ?? materialCode}
              lang={lang}
            />
          )}
          {!isPlts && (
            <>
              <ScopeItem
                icon="🎨"
                label={t.configurator.specExteriorColor}
                value={EXTERIOR_COLOR_MAP.get(exteriorColor ?? DEFAULT_EXTERIOR_COLOR)?.[lang === "id" ? "labelId" : "labelEn"] ?? "—"}
                lang={lang}
              />
              <ScopeItem
                icon="🛋️"
                label={t.configurator.specInteriorColor}
                value={INTERIOR_COLOR_MAP.get(interiorColor ?? DEFAULT_INTERIOR_COLOR)?.[lang === "id" ? "labelId" : "labelEn"] ?? "—"}
                lang={lang}
              />
            </>
          )}
          {includePlts && (
            <ScopeItem
              icon="☀️"
              label={t.configurator.specPlts}
              value={lang === "id" ? "Sistem PLTS lengkap" : "Full solar system"}
              lang={lang}
            />
          )}
          {addonCodes.length > 0 && (
            <ScopeItem
              icon="⚡"
              label={t.configurator.specAddons}
              value={`${addonCodes.length} ${lang === "id" ? "item" : "items"}`}
              specs={addonCodes.map((c) => lookup(c)?.[lang === "id" ? "nameId" : "nameEn"] ?? c)}
              lang={lang}
            />
          )}
        </div>
      </SowSection>

      {/* --- 2. Deliverables --- */}
      <SowSection icon="📦" title={t.configurator.sowDeliverables} desc={t.configurator.sowDeliverablesDesc}>
        <ul className="mt-3 space-y-2">
          {[
            { emoji: "🚐", text: lang === "id" ? `Kendaraan ${vehicle?.labelId ?? ""} setelah konversi` : `Converted ${vehicle?.labelEn ?? ""} vehicle` },
            { emoji: "📋", text: lang === "id" ? "Dokumentasi foto & video proses pengerjaan" : "Photo & video documentation of the work process" },
            { emoji: "📖", text: lang === "id" ? "Panduan pemeliharaan & operasional" : "Maintenance & operations manual" },
            { emoji: "🛡️", text: lang === "id" ? `Sertifikat garansi ${warrantyMonths} bulan` : `${warrantyMonths}-month warranty certificate` },
            { emoji: "🔑", text: lang === "id" ? "Spare parts & remote (jika ada)" : "Spare parts & remotes (if applicable)" },
            ...(includePlts || isPlts
              ? [{ emoji: "⚡", text: lang === "id" ? "Sertifikat uji sistem PLTS" : "Solar system test certificate" }]
              : []),
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-white px-3 py-2.5">
              <span className="mt-0.5 text-sm">{item.emoji}</span>
              <span className="text-xs font-medium text-slate-700">{item.text}</span>
            </li>
          ))}
        </ul>
      </SowSection>

      {/* --- 3. Milestones & Timeline --- */}
      <SowSection icon="🗓️" title={t.configurator.sowTimeline} desc={t.configurator.sowTimelineDesc}>
        <div className="mt-3 space-y-0">
          {milestones.map((ms, idx) => {
            const isLast = idx === milestones.length - 1;
            return (
              <div key={idx} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${isLast ? "bg-emerald-600" : "bg-slate-400"}`}>
                    {idx + 1}
                  </div>
                  {!isLast && <div className="w-0.5 flex-1 bg-slate-200" />}
                </div>
                <div className={`flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{ms.label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {lang === "id" ? `Hari ke-${ms.day}` : `Day ${ms.day}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
          ⏱️ {lang === "id" ? `Estimasi total: ${totalWeeks} minggu (${schedule.totalDays} hari kerja)` : `Estimated total: ${totalWeeks} weeks (${schedule.totalDays} work days)`}
        </div>
      </SowSection>

      {/* --- 4. Payment Terms --- */}
      <SowSection icon="💰" title={t.configurator.sowPaymentTerms} desc={t.configurator.sowPaymentTermsDesc}>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <PaymentCard
            step="1"
            label={lang === "id" ? t.configurator.sowPayment1 : t.configurator.sowPayment1}
            desc={lang === "id" ? t.configurator.sowPayment1Desc : t.configurator.sowPayment1Desc}
            pct={40}
            amount={dpAmount}
            color="emerald"
            lang={lang}
          />
          <PaymentCard
            step="2"
            label={lang === "id" ? t.configurator.sowPayment2 : t.configurator.sowPayment2}
            desc={lang === "id" ? t.configurator.sowPayment2Desc : t.configurator.sowPayment2Desc}
            pct={40}
            amount={progressAmount}
            color="sky"
            lang={lang}
          />
          <PaymentCard
            step="3"
            label={lang === "id" ? t.configurator.sowPayment3 : t.configurator.sowPayment3}
            desc={lang === "id" ? t.configurator.sowPayment3Desc : t.configurator.sowPayment3Desc}
            pct={20}
            amount={finalAmount}
            color="violet"
            lang={lang}
          />
        </div>
        {/* Payment bar */}
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
          <div className="flex h-full">
            <div className="bg-emerald-500 transition-all" style={{ width: "40%" }} />
            <div className="bg-sky-500 transition-all" style={{ width: "40%" }} />
            <div className="bg-violet-500 transition-all" style={{ width: "20%" }} />
          </div>
        </div>
        <div className="mt-1.5 flex text-[10px] font-semibold text-slate-400">
          <span style={{ width: "40%" }}>40% DP</span>
          <span style={{ width: "40%" }}>40%</span>
          <span style={{ width: "20%" }}>20%</span>
        </div>
      </SowSection>

      {/* --- 5. Inclusions & Exclusions --- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <SowSection icon="✅" title={t.configurator.sowInclusions} desc="">
          <ul className="mt-2 space-y-1.5">
            {inclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
                <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </SowSection>

        <SowSection icon="⚠️" title={t.configurator.sowExclusions} desc="">
          <ul className="mt-2 space-y-1.5">
            {exclusions.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600">
                <span className="mt-0.5 shrink-0 text-red-400">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </SowSection>
      </div>

      {/* --- 6. Warranty --- */}
      <SowSection icon="🛡️" title={t.configurator.sowWarrantyTitle} desc={t.configurator.sowWarrantyDesc}>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm font-bold text-emerald-800">
              🛠️ {lang === "id" ? "Garansi Kerja" : "Workmanship Warranty"}
            </div>
            <div className="mt-1 text-lg font-extrabold text-emerald-600">{warrantyMonths} {lang === "id" ? "bulan" : "months"}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-700">
              {lang === "id"
                ? "Cakup semua pekerjaan konversi — jika ada yang longgar, bocor, atau tidak berfungsi, kami perbaiki tanpa biaya tambahan."
                : "Covers all conversion work — if anything is loose, leaking, or not functioning, we fix it at no extra cost."}
            </p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <div className="text-sm font-bold text-sky-800">
              🔧 {lang === "id" ? "Garansi Komponen" : "Component Warranty"}
            </div>
            <div className="mt-1 text-lg font-extrabold text-sky-600">
              {lang === "id" ? "Mengikuti garansi pabrikan" : "Per manufacturer warranty"}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-sky-700">
              {lang === "id"
                ? "Setiap komponen (AC, kulkas, panel surya, baterai) mendapat garansi resmi dari produsen. Kami bantu proses klaim."
                : "Each component (AC, fridge, solar panel, battery) carries the manufacturer's official warranty. We help with claims."}
            </p>
          </div>
        </div>
      </SowSection>

      {/* --- 7. Acceptance --- */}
      <SowSection icon="🤝" title={t.configurator.sowAcceptance} desc="">
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          {lang === "id"
            ? `Proyek dianggap selesai dan diterima setelah kamu melakukan inspeksi fisik kendaraan di bengkel kami. Selama inspeksi, teknisi akan mendampingi menjelaskan setiap fitur. Jika ada catatan perbaikan minor, kami selesaikan dalam ${Math.max(1, Math.ceil(productionDays * 0.1))} hari kerja sebelum serah terima final.`
            : `The project is considered complete and accepted after you perform a physical inspection of the vehicle at our workshop. During the inspection, a technician will walk you through every feature. If there are minor repair notes, we'll complete them within ${Math.max(1, Math.ceil(productionDays * 0.1))} work days before final handover.`}
        </p>
      </SowSection>

      {/* Footer disclaimer */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-slate-500">
          {lang === "id"
            ? `📄 Dokumen ini adalah Pernyataan Kerja (Statement of Work) yang dibuat otomatis berdasarkan konfigurasimu. Estimasi biaya berlaku 30 hari. Detail final akan dikonfirmasi dalam perjanjian kerja resmi setelah konsultasi.`
            : `📄 This is an automatically generated Statement of Work based on your configuration. Cost estimates are valid for 30 days. Final details will be confirmed in the official work agreement after consultation.`}
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function SowSection({
  icon,
  title,
  desc,
  children,
}: {
  icon: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>
      {desc && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{desc}</p>}
      {children}
    </div>
  );
}

function ScopeItem({
  icon,
  label,
  value,
  specs,
  lang,
}: {
  icon: string;
  label: string;
  value: string;
  specs?: string[];
  lang: "id" | "en";
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
      <span className="mt-0.5 text-lg">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-xs font-bold text-slate-800">{value}</div>
        {specs && specs.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {specs.slice(0, 6).map((s) => (
              <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                {s}
              </span>
            ))}
            {specs.length > 6 && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                +{specs.length - 6}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentCard({
  step,
  label,
  desc,
  pct,
  amount,
  color,
  lang,
}: {
  step: string;
  label: string;
  desc: string;
  pct: number;
  amount: number;
  color: "emerald" | "sky" | "violet";
  lang: "id" | "en";
}) {
  const colorMap = {
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
    sky: { border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-700", badge: "bg-sky-100 text-sky-700" },
    violet: { border: "border-violet-200", bg: "bg-violet-50", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  };
  const c = colorMap[color];

  return (
    <div className={`rounded-xl border-2 ${c.border} ${c.bg} p-4`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${c.badge}`}>
          {step}
        </span>
        <span className="text-xs font-bold text-slate-800">{label}</span>
      </div>
      <div className="mt-2 text-lg font-extrabold text-slate-900">
        {pct}% <span className="text-sm font-normal text-slate-500">= {formatIDR(amount)}</span>
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}
