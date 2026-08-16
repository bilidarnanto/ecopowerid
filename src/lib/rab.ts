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
