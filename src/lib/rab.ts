import { siteConfig } from "./site-config";
import { calculatePlts, pltsLinesToRab, type CatalogProvider, type PltsResult } from "./plts";
import { APPLIANCE_MAP } from "./loads";
import type { VehicleType } from "./configurator-data";

// ------------------------------------------------------------------
// Tipe data
// ------------------------------------------------------------------

export type CatalogComponent = {
  code: string;
  nameId: string;
  nameEn: string;
  category: string;
  unit: string;
  price: number;
  specs: Record<string, unknown> | null;
};

export type ApplianceSelection = { qty: number; hours: number };

export type ConfiguratorState = {
  vehicleType: VehicleType;
  packageCode: string | null;
  layoutCode: string | null;
  materialCode: string | null;
  addonCodes: string[];
  appliances: Record<string, ApplianceSelection>;
  includePlts: boolean;
  /** Input manual (opsional) — menggantikan perhitungan dari peralatan jika diisi */
  manualDailyWh?: number;
  manualPeakW?: number;
  /** Warna eksterior (kode ColorOption) */
  exteriorColor?: string;
  /** Warna interior (kode ColorOption) */
  interiorColor?: string;
};

export type RabLine = {
  id: string;
  group: string;
  code: string;
  nameId: string;
  nameEn: string;
  spec: string;
  unit: string;
  qty: number;
  price: number;
  subtotal: number;
  /** Spesifikasi teknis komponen (dari katalog) untuk detail RAB */
  specs?: Record<string, unknown> | null;
  /** Berat per unit (kg) — dipakai menghitung estimasi berat total */
  weightKg?: number;
};

export type RabTotals = {
  subtotal: number;
  marginPct: number;
  margin: number;
  ppnPct: number;
  ppn: number;
  total: number;
  /** Estimasi berat total (kg) dari semua komponen */
  weightKg: number;
};

// ------------------------------------------------------------------
// Peningkatan Algoritma RAB: Analisis Biaya Lanjutan
// ------------------------------------------------------------------

/** Faktor kerumitan proyek (0.8 — 1.3) */
export type ComplexityResult = {
  score: number;
  label: string;
  description: string;
};

/** Breakdown biaya lanjutan */
export type AdvancedCostBreakdown = {
  /** Biaya material dasar */
  baseMaterialCost: number;
  /** Faktor material waste per kategori */
  materialWaste: {
    struktur: number;
    interior: number;
    peralatan: number;
    plumbing: number;
    totalWasteCost: number;
    wastePctAvg: number;
  };
  /** Estimasi biaya tenaga kerja */
  laborCost: {
    workDays: number;
    hourlyRate: number;
    hoursPerDay: number;
    totalHours: number;
    totalCost: number;
  };
  /** Contingency buffer */
  contingency: {
    pct: number;
    amount: number;
    reason: string;
  };
  /** Diskon volume */
  volumeDiscount: {
    pct: number;
    amount: number;
    tier: string;
  };
  /** Skor kompleksitas */
  complexity: ComplexityResult;
  /** Total setelah semua kalkulasi */
  grandTotalBeforeTax: number;
  ppn: number;
  grandTotal: number;
};

// Material waste factor per kategori (% material yang terbuang)
const MATERIAL_WASTE: Record<string, number> = {
  STRUKTUR: 0.12,   // 12% — potongan baja/aluminium
  INTERIOR: 0.08,   // 8% — potongan plywood/HPL
  PERALATAN: 0.03,  // 3% — barang jadi, minimal waste
  PLTS: 0.02,       // 2% — modul standar
  LISTRIK: 0.05,    // 5% — kabel & aksesoris
  PLUMBING: 0.05,   // 5% — pipa & fitting
  JASA: 0,          // 0% — jasa tidak ada waste
};

// Tarif upah per jam kerja (Rp)
const LABOR_HOURLY_RATE = Number(process.env.RAB_LABOR_RATE ?? 75_000);
const LABOR_HOURS_PER_DAY = 8;

/** Hitung skor kompleksitas proyek */
export function calculateComplexity(
  vehicleType: VehicleType,
  packageCode: string | null,
  addonCodes: string[],
  includePlts: boolean,
  layoutCode: string | null
): ComplexityResult {
  let score = 1.0;
  const reasons: string[] = [];

  // Faktor tipe kendaraan
  if (vehicleType === "motorhome") {
    score += 0.15;
    reasons.push("Motorhome lebih kompleks");
  } else if (vehicleType === "foodtruck") {
    score += 0.10;
    reasons.push("Food truck butuh instalasi khusus");
  }

  // Faktor paket
  if (packageCode?.includes("PRM")) {
    score += 0.10;
    reasons.push("Paket Premium");
  } else if (packageCode?.includes("DLX")) {
    score += 0.05;
    reasons.push("Paket Deluxe");
  }

  // Faktor jumlah add-on (semakin banyak = semakin kompleks)
  if (addonCodes.length >= 5) {
    score += 0.10;
    reasons.push(`${addonCodes.length} add-on (banyak)`);
  } else if (addonCodes.length >= 3) {
    score += 0.05;
    reasons.push(`${addonCodes.length} add-on`);
  }

  // Faktor PLTS
  if (includePlts) {
    score += 0.08;
    reasons.push("Instalasi PLTS");
  }

  // Faktor custom layout
  if (layoutCode?.includes("LAY-3")) {
    score += 0.10;
    reasons.push("Layout custom");
  }

  // Clamp
  score = Math.min(1.3, Math.max(0.8, score));

  const label =
    score >= 1.2 ? "Sangat Kompleks"
    : score >= 1.1 ? "Kompleks"
    : score >= 1.0 ? "Standar"
    : "Sederhana";

  const description =
    reasons.length > 0 ? reasons.join(", ") : "Konfigurasi dasar";

  return { score, label, description };
}

/** Hitung diskon volume berdasarkan jumlah komponen */
export function calculateVolumeDiscount(
  totalLines: number,
  subtotalBeforeDiscount: number
): { pct: number; amount: number; tier: string } {
  // Tier berdasarkan subtotal
  if (subtotalBeforeDiscount >= 100_000_000) {
    return { pct: 3, amount: Math.round(subtotalBeforeDiscount * 0.03), tier: "Proyek Besar (≥Rp100jt)" };
  }
  if (subtotalBeforeDiscount >= 50_000_000) {
    return { pct: 2, amount: Math.round(subtotalBeforeDiscount * 0.02), tier: "Proyek Menengah (≥Rp50jt)" };
  }
  if (subtotalBeforeDiscount >= 25_000_000) {
    return { pct: 1, amount: Math.round(subtotalBeforeDiscount * 0.01), tier: "Proyek Standar (≥Rp25jt)" };
  }
  return { pct: 0, amount: 0, tier: "" };
}

/** Hitung biaya tenaga kerja dari workDays komponen */
export function calculateLaborCost(
  lines: RabLine[]
): { workDays: number; hourlyRate: number; hoursPerDay: number; totalHours: number; totalCost: number } {
  // Ambil workDays terbesar dari semua komponen
  const maxWorkDays = Math.max(
    0,
    ...lines.map((l) =>
      typeof l.specs?.workDays === "number" ? (l.specs.workDays as number) : 0
    )
  );
  const totalHours = maxWorkDays * LABOR_HOURS_PER_DAY;
  const totalCost = Math.round(totalHours * LABOR_HOURLY_RATE);
  return {
    workDays: maxWorkDays,
    hourlyRate: LABOR_HOURLY_RATE,
    hoursPerDay: LABOR_HOURS_PER_DAY,
    totalHours,
    totalCost,
  };
}

/** Hitung material waste per kategori */
export function calculateMaterialWaste(
  lines: RabLine[]
): { struktur: number; interior: number; peralatan: number; plumbing: number; totalWasteCost: number; wastePctAvg: number } {
  const wasteByGroup: Record<string, number> = {};
  let totalSubtotal = 0;

  for (const line of lines) {
    const wastePct = MATERIAL_WASTE[line.group] ?? 0.05;
    const waste = Math.round(line.subtotal * wastePct);
    wasteByGroup[line.group] = (wasteByGroup[line.group] ?? 0) + waste;
    totalSubtotal += line.subtotal;
  }

  const totalWasteCost = Object.values(wasteByGroup).reduce((s, v) => s + v, 0);
  const wastePctAvg = totalSubtotal > 0 ? Math.round((totalWasteCost / totalSubtotal) * 100 * 10) / 10 : 0;

  return {
    struktur: wasteByGroup["STRUKTUR"] ?? 0,
    interior: wasteByGroup["INTERIOR"] ?? 0,
    peralatan: wasteByGroup["PERALATAN"] ?? 0,
    plumbing: wasteByGroup["PLUMBING"] ?? 0,
    totalWasteCost,
    wastePctAvg,
  };
}

/** Hitung contingency buffer */
export function calculateContingency(
  subtotal: number,
  complexity: ComplexityResult
): { pct: number; amount: number; reason: string } {
  // Base contingency 5%, tambah berdasarkan kompleksitas
  let pct = 5;
  const reasons: string[] = [];

  if (complexity.score >= 1.2) {
    pct += 3;
    reasons.push("Kompleksitas tinggi");
  } else if (complexity.score >= 1.1) {
    pct += 2;
    reasons.push("Kompleksitas sedang");
  }

  if (complexity.score < 1.0) {
    pct -= 2;
    reasons.push("Proyek sederhana");
  }

  pct = Math.max(3, Math.min(10, pct));
  const amount = Math.round(subtotal * (pct / 100));
  const reason = reasons.length > 0 ? reasons.join(", ") : "Standar industri";
  return { pct, amount, reason };
}

/** Kalkulasi RAB lanjutan — menggabungkan semua faktor */
export function buildAdvancedRabBreakdown(
  lines: RabLine[],
  state: ConfiguratorState
): AdvancedCostBreakdown {
  const baseMaterialCost = lines.reduce((s, l) => s + l.subtotal, 0);
  const complexity = calculateComplexity(
    state.vehicleType,
    state.packageCode,
    state.addonCodes,
    state.includePlts,
    state.layoutCode
  );

  const materialWaste = calculateMaterialWaste(lines);
  const laborCost = calculateLaborCost(lines);
  const volumeDiscount = calculateVolumeDiscount(lines.length, baseMaterialCost);

  // Subtotal + waste + complexity
  const costAfterWaste = baseMaterialCost + materialWaste.totalWasteCost;
  const costAfterComplexity = Math.round(costAfterWaste * complexity.score);
  const costAfterLabor = costAfterComplexity + laborCost.totalCost;
  const costAfterDiscount = costAfterLabor - volumeDiscount.amount;

  // Contingency dihitung dari subtotal setelah kompleksitas
  const contingency = calculateContingency(costAfterComplexity, complexity);
  const grandTotalBeforeTax = costAfterDiscount + contingency.amount;

  const ppnPct = siteConfig.includePpn ? siteConfig.ppnPct : 0;
  const ppn = Math.round(grandTotalBeforeTax * (ppnPct / 100));
  const grandTotal = grandTotalBeforeTax + ppn;

  return {
    baseMaterialCost,
    materialWaste,
    laborCost,
    contingency,
    volumeDiscount,
    complexity,
    grandTotalBeforeTax,
    ppn,
    grandTotal,
  };
}

export type Rab = {
  lines: RabLine[];
  totals: RabTotals;
};

export const RAB_GROUPS = [
  "STRUKTUR",
  "INTERIOR",
  "PERALATAN",
  "PLTS",
  "LISTRIK",
  "PLUMBING",
  "JASA",
] as const;

export type RabGroup = (typeof RAB_GROUPS)[number];

const CATEGORY_TO_GROUP: Record<string, RabGroup> = {
  STRUKTUR: "STRUKTUR",
  INTERIOR: "INTERIOR",
  PERALATAN: "PERALATAN",
  PLTS_PANEL: "PLTS",
  PLTS_BATTERY: "PLTS",
  PLTS_INVERTER: "PLTS",
  PLTS_SCC: "PLTS",
  PLTS_BOS: "PLTS",
  LISTRIK: "LISTRIK",
  PLUMBING: "PLUMBING",
  JASA: "JASA",
};

export function groupOf(category: string): RabGroup {
  return CATEGORY_TO_GROUP[category] ?? "PERALATAN";
}

export type CatalogProvider2 = {
  byCode: (code: string) => CatalogComponent | undefined;
  byCategory: (category: string) => CatalogComponent[];
};

/** Bangun provider katalog sinkron dari daftar komponen (dipakai client & server) */
export function buildProvider(components: CatalogComponent[]): CatalogProvider2 {
  const byCode = (code: string) => components.find((c) => c.code === code);
  const byCategory = (category: string) =>
    components.filter((c) => c.category === category);
  return { byCode, byCategory };
}

/** Konversi provider lokal (dengan category) ke bentuk yang dipahami mesin PLTS */
function toPltsProvider(catalog: CatalogProvider2): CatalogProvider {
  return {
    byCode: (code) => catalog.byCode(code),
    byCategory: (category) => catalog.byCategory(category),
  };
}

// ------------------------------------------------------------------
// Kalkulasi energi dari pilihan peralatan
// ------------------------------------------------------------------

export function energyFromAppliances(
  appliances: Record<string, ApplianceSelection>
): { dailyWh: number; peakW: number } {
  let dailyWh = 0;
  let peakW = 0;
  for (const [code, sel] of Object.entries(appliances)) {
    const def = APPLIANCE_MAP.get(code);
    if (!def || sel.qty <= 0 || sel.hours <= 0) continue;
    dailyWh += def.watts * sel.hours * sel.qty;
    peakW += def.watts * sel.qty;
  }
  return { dailyWh: Math.round(dailyWh), peakW };
}

export function energyFromState(state: {
  appliances: Record<string, ApplianceSelection>;
  manualDailyWh?: number;
  manualPeakW?: number;
}): { dailyWh: number; peakW: number } {
  const computed = energyFromAppliances(state.appliances);
  const dailyWh =
    state.manualDailyWh && state.manualDailyWh > 0
      ? Math.round(state.manualDailyWh)
      : computed.dailyWh;
  const peakW =
    state.manualPeakW && state.manualPeakW > 0
      ? Math.round(state.manualPeakW)
      : computed.peakW;
  return { dailyWh, peakW };
}

// ------------------------------------------------------------------
// Builder RAB utama
// ------------------------------------------------------------------

export function buildRab(
  state: ConfiguratorState,
  catalog: CatalogProvider2
): Rab {
  const lines: RabLine[] = [];
  let counter = 0;
  const addLine = (
    code: string,
    group: RabGroup,
    nameId: string,
    nameEn: string,
    spec: string,
    unit: string,
    qty: number,
    price: number,
    specs?: Record<string, unknown> | null,
    weightKg?: number
  ) => {
    counter += 1;
    lines.push({
      id: `${group}-${code}-${counter}`,
      group,
      code,
      nameId,
      nameEn,
      spec,
      unit,
      qty,
      price,
      subtotal: Math.round(qty * price),
      specs,
      weightKg,
    });
  };

  const pushComponent = (code: string, group: RabGroup, spec = "", qty = 1) => {
    const c = catalog.byCode(code);
    if (!c) return;
    const weightKg =
      typeof c.specs?.weightKg === "number" ? (c.specs.weightKg as number) : undefined;
    addLine(c.code, group, c.nameId, c.nameEn, spec, c.unit, qty, c.price, c.specs, weightKg);
  };

  if (state.vehicleType !== "plts") {
    if (state.packageCode) pushComponent(state.packageCode, "STRUKTUR");
    if (state.layoutCode) pushComponent(state.layoutCode, "INTERIOR");
    if (state.materialCode) pushComponent(state.materialCode, "INTERIOR");
    for (const code of state.addonCodes) {
      const c = catalog.byCode(code);
      if (!c) continue;
      pushComponent(code, groupOf(c.category));
    }
  }

  if (state.includePlts || state.vehicleType === "plts") {
    const { dailyWh, peakW } = energyFromState(state);
    if (dailyWh > 0 && peakW > 0) {
      const plts = calculatePlts({ dailyWh, peakW }, toPltsProvider(catalog));
      lines.push(...pltsLinesToRab(plts.lines));
    }
  }

  return applyTotals(lines);
}

export function applyTotals(lines: RabLine[]): Rab {
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const marginPct = siteConfig.marginPct;
  const margin = Math.round(subtotal * (marginPct / 100));
  const ppnPct = siteConfig.includePpn ? siteConfig.ppnPct : 0;
  const ppn = Math.round((subtotal + margin) * (ppnPct / 100));
  const total = subtotal + margin + ppn;
  const weightKg = Math.round(
    lines.reduce((s, l) => s + (l.weightKg ?? 0) * l.qty, 0)
  );
  return { lines, totals: { subtotal, marginPct, margin, ppnPct, ppn, total, weightKg } };
}

/** RAB murni PLTS (halaman kalkulator mandiri) */
export function buildPltsRab(plts: PltsResult): Rab {
  return applyTotals(pltsLinesToRab(plts.lines));
}

// ------------------------------------------------------------------
// Format spesifikasi teknis untuk ditampilkan di RAB
// ------------------------------------------------------------------

const SPEC_LABELS: { key: string; labelId: string; labelEn: string }[] = [
  { key: "wp", labelId: "Wp", labelEn: "Wp" },
  { key: "ah", labelId: "Ah", labelEn: "Ah" },
  { key: "watts", labelId: "W", labelEn: "W" },
  { key: "powerW", labelId: "W", labelEn: "W" },
  { key: "amps", labelId: "A", labelEn: "A" },
  { key: "voltage", labelId: "V", labelEn: "V" },
  { key: "weightKg", labelId: "kg", labelEn: "kg" },
  { key: "capacity", labelId: "org", labelEn: "ppl" },
  { key: "capacityL", labelId: "L", labelEn: "L" },
  { key: "burners", labelId: "tungku", labelEn: "burners" },
  { key: "screenInch", labelId: 'in', labelEn: 'in' },
  { key: "lengthM", labelId: "m", labelEn: "m" },
  { key: "loadCapacityKg", labelId: "kg", labelEn: "kg" },
  { key: "workDays", labelId: "hari kerja", labelEn: "work days" },
  { key: "warrantyMonths", labelId: "bln garansi", labelEn: "mo warranty" },
];

/** Ubah objek specs (mis. { wp: 450, weightKg: 24 }) jadi chip teks singkat */
export function formatSpecs(
  specs: Record<string, unknown> | null | undefined,
  lang: "id" | "en"
): string[] {
  if (!specs) return [];
  const chips: string[] = [];
  for (const { key, labelId, labelEn } of SPEC_LABELS) {
    const v = specs[key];
    if (typeof v !== "number" && typeof v !== "string") continue;
    // skip nol/kosong (mis. capacity 0 untuk custom layout)
    if (typeof v === "number" && v === 0) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    chips.push(`${v} ${lang === "id" ? labelId : labelEn}`.trim());
  }
  return chips;
}
