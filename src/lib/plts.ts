import { siteConfig } from "./site-config";

// ------------------------------------------------------------------
// Tipe data
// ------------------------------------------------------------------

export type PltsCatalogItem = {
  code: string;
  nameId: string;
  nameEn: string;
  price: number;
  unit: string;
  specs?: Record<string, unknown> | null;
};

export type PltsLine = {
  code: string;
  nameId: string;
  nameEn: string;
  spec: string;
  unit: string;
  qty: number;
  price: number; // harga satuan IDR
};

export type PltsInput = {
  dailyWh: number;
  peakW: number;
  autonomyDays?: number;
  sunHours?: number;
  systemVoltage?: number;
};

export type PltsResult = {
  input: PltsInput;
  dailyWh: number;
  peakW: number;
  requiredWp: number;
  panelQty: number;
  panelWpPerUnit: number;
  panelTotalWp: number;
  batteryQty: number;
  batteryAhPerUnit: number;
  batteryVoltage: number;
  batteryTotalWh: number;
  inverterW: number;
  sccA: number;
  lines: PltsLine[];
};

export type CatalogProvider = {
  /** Ambil komponen per kode */
  byCode: (code: string) => PltsCatalogItem | undefined;
  /** Ambil komponen per kategori, diurutkan */
  byCategory: (category: string) => PltsCatalogItem[];
};

// ------------------------------------------------------------------
// Utilitas
// ------------------------------------------------------------------

function num(specs: Record<string, unknown> | null | undefined, key: string): number {
  const v = specs?.[key];
  return typeof v === "number" ? v : Number(v ?? 0) || 0;
}

function pickSmallest(
  items: PltsCatalogItem[],
  required: number,
  key: string
): PltsCatalogItem | undefined {
  const sorted = [...items].sort((a, b) => num(a.specs, key) - num(b.specs, key));
  return sorted.find((i) => num(i.specs, key) >= required) ?? sorted[sorted.length - 1];
}

function pickLargest(items: PltsCatalogItem[], key: string): PltsCatalogItem | undefined {
  const sorted = [...items].sort((a, b) => num(b.specs, key) - num(a.specs, key));
  return sorted[0];
}

// ------------------------------------------------------------------
// Mesin kalkulasi
// ------------------------------------------------------------------

export function calculatePlts(
  input: PltsInput,
  catalog: CatalogProvider
): PltsResult {
  const cfg = siteConfig.plts;
  const sunHours = input.sunHours ?? cfg.sunHours;
  const autonomyDays = input.autonomyDays ?? 2;
  const voltage = input.systemVoltage ?? cfg.batteryVoltage;

  const dailyWh = Math.max(1, Math.round(input.dailyWh));
  const peakW = Math.max(1, Math.round(input.peakW));

  // --- Panel surya ---
  const requiredWp = Math.ceil(dailyWh / (sunHours * cfg.derating));
  const panels = catalog.byCategory("PLTS_PANEL").filter((p) => num(p.specs, "wp") > 0);
  const panelUnit = panels.length ? pickLargest(panels, "wp")! : undefined;
  const panelWpPerUnit = panelUnit ? num(panelUnit.specs, "wp") : 450;
  const panelQty = Math.max(1, Math.ceil(requiredWp / panelWpPerUnit));
  const panelTotalWp = panelQty * panelWpPerUnit;

  // --- Baterai ---
  const requiredAh = Math.ceil(
    (dailyWh * autonomyDays) / (cfg.batteryDoD * voltage)
  );
  const batteries = catalog
    .byCategory("PLTS_BATTERY")
    .filter((b) => num(b.specs, "ah") > 0);
  const batteryUnit = batteries.length ? pickLargest(batteries, "ah")! : undefined;
  const batteryAhPerUnit = batteryUnit ? num(batteryUnit.specs, "ah") : 100;
  const batteryQty = Math.max(1, Math.ceil(requiredAh / batteryAhPerUnit));
  const batteryTotalWh = batteryQty * batteryAhPerUnit * voltage;

  // --- Inverter ---
  const inverterRequired = Math.ceil(peakW * cfg.inverterOversize);
  const inverters = catalog
    .byCategory("PLTS_INVERTER")
    .filter((i) => num(i.specs, "watts") > 0);
  const inverterUnit = inverters.length
    ? pickSmallest(inverters, inverterRequired, "watts")
    : undefined;
  const inverterW = inverterUnit ? num(inverterUnit.specs, "watts") : inverterRequired;

  // --- Solar charge controller (MPPT) ---
  const sccRequired = Math.ceil((panelTotalWp / voltage) * cfg.sccOversize);
  const sccs = catalog.byCategory("PLTS_SCC").filter((s) => num(s.specs, "amps") > 0);
  const sccUnit = sccs.length ? pickSmallest(sccs, sccRequired, "amps") : undefined;
  const sccA = sccUnit ? num(sccUnit.specs, "amps") : sccRequired;

  // ------------------------------------------------------------------
  // Baris RAB
  // ------------------------------------------------------------------
  const lines: PltsLine[] = [];
  const get = (code: string) => catalog.byCode(code);

  const push = (
    code: string,
    fallbackNameId: string,
    fallbackNameEn: string,
    spec: string,
    unit: string,
    qty: number
  ) => {
    const c = get(code);
    if (!c) return;
    lines.push({
      code: c.code,
      nameId: c.nameId,
      nameEn: c.nameEn,
      spec,
      unit: c.unit || unit,
      qty,
      price: c.price,
    });
  };

  if (panelUnit) {
    push(
      panelUnit.code,
      "Panel Surya",
      "Solar Panel",
      `${panelWpPerUnit} Wp`,
      "unit",
      panelQty
    );
  }
  if (batteryUnit) {
    push(
      batteryUnit.code,
      "Baterai LiFePO4",
      "LiFePO4 Battery",
      `${batteryAhPerUnit} Ah / ${voltage}V`,
      "unit",
      batteryQty
    );
  }
  if (inverterUnit) {
    push(
      inverterUnit.code,
      "Inverter",
      "Inverter",
      `${inverterW} W pure sine`,
      "unit",
      1
    );
  }
  if (sccUnit) {
    push(
      sccUnit.code,
      "Solar Charge Controller",
      "Solar Charge Controller",
      `MPPT ${sccA} A`,
      "unit",
      1
    );
  }

  // BOS — kabel & proteksi
  push("PLTS-BOS-DC", "Kabel DC 6mm", "DC Cable 6mm", "6 mm² (panjang sesuai layout)", "meter", panelQty * 3 + batteryQty * 2);
  push("PLTS-BOS-AC", "Kabel AC", "AC Cable", "NYM 2.5mm", "meter", 10);
  push("PLTS-BOS-MC4", "Konektor MC4", "MC4 Connector", "pasang", "pasang", panelQty + 2);
  push("PLTS-BOS-FUSE", "Fuse & Holder", "Fuse & Holder", "sesuai arus sistem", "set", 1);
  push("PLTS-BOS-DCBRK", "DC Breaker", "DC Breaker", "sesuai arus sistem", "unit", 1);
  push("PLTS-BOS-ACBRK", "AC Breaker", "AC Breaker", "sesuai daya inverter", "unit", 1);
  push("PLTS-BOS-BUSBAR", "Busbar & Distribusi", "Busbar & Distribution", "blok distribusi positif/negatif", "set", 1);
  push("PLTS-BOS-GND", "Kit Grounding", "Grounding Kit", "pengaman petir & grounding", "set", 1);
  push("PLTS-BOS-MOUNT", "Rakitan & Mounting", "Racking & Mounting", "sesuai tipe atap kendaraan", "set", 1);
  push("PLTS-BOS-JBOX", "Junction Box", "Junction Box", "kombiner & proteksi", "unit", 1);

  // Jasa instalasi (tarif per Wp diambil dari katalog, fallback ke site config)
  const jasa = get("PLTS-JASA-INSTALL");
  const jasaPerWp = jasa ? jasa.price : cfg.jasaPerWp;
  if (jasa) {
    lines.push({
      code: jasa.code,
      nameId: jasa.nameId,
      nameEn: jasa.nameEn,
      spec: `${panelTotalWp} Wp × Rp ${jasaPerWp.toLocaleString("id-ID")}/Wp`,
      unit: "Wp",
      qty: panelTotalWp,
      price: jasaPerWp,
    });
  }

  return {
    input,
    dailyWh,
    peakW,
    requiredWp,
    panelQty,
    panelWpPerUnit,
    panelTotalWp,
    batteryQty,
    batteryAhPerUnit,
    batteryVoltage: voltage,
    batteryTotalWh,
    inverterW,
    sccA,
    lines,
  };
}

export const PLTS_GROUP = "PLTS";

/** Konversi baris PLTS ke baris RAB umum (dengan grup) */
export function pltsLinesToRab(lines: PltsLine[]) {
  return lines.map((l, i) => ({
    id: `plts-${l.code}-${i}`,
    group: PLTS_GROUP,
    code: l.code,
    nameId: l.nameId,
    nameEn: l.nameEn,
    spec: l.spec,
    unit: l.unit,
    qty: l.qty,
    price: l.price,
    subtotal: l.qty * l.price,
  }));
}
