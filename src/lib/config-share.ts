// Serialisasi konfigurasi untuk "Simpan & Bagikan" (localStorage + URL share link).
// Format kompak berbasis base64url; hanya kode & angka yang disimpan (tanpa teks),
// jadi payload kecil dan aman untuk URL.

import {
  EXTERIOR_COLORS,
  INTERIOR_COLORS,
  VEHICLE_CONFIGS,
  type VehicleType,
} from "./configurator-data";
import { APPLIANCE_MAP } from "./loads";
import type { ApplianceSelection, ConfiguratorState } from "./rab";
import type { LocationInfo } from "./solar-data";

export type ShareableState = {
  v: VehicleType;
  p: string | null;
  l: string | null;
  m: string | null;
  a: string[];
  ap: Record<string, ApplianceSelection>;
  plts: boolean;
  mdwh: number | null;
  mpw: number | null;
  ec: string | null;
  ic: string | null;
  loc?: {
    lat: number;
    lon: number;
    cid: string;
    cn: string;
    prov: string;
    psh: number;
    src: string;
  } | null;
  s: number;
};

const OPTION_CODES = new Set(
  VEHICLE_CONFIGS.flatMap((v) => v.groups.flatMap((g) => g.options.map((o) => o.code)))
);
const EXT_CODES = new Set(EXTERIOR_COLORS.map((c) => c.code));
const INT_CODES = new Set(INTERIOR_COLORS.map((c) => c.code));
const VEHICLE_TYPES = new Set<VehicleType>(VEHICLE_CONFIGS.map((v) => v.type));

export function serializeConfig(
  state: ConfiguratorState,
  step: number
): string {
  const data: ShareableState = {
    v: state.vehicleType,
    p: state.packageCode,
    l: state.layoutCode,
    m: state.materialCode,
    a: state.addonCodes,
    ap: state.appliances,
    plts: state.includePlts,
    mdwh: state.manualDailyWh ?? null,
    mpw: state.manualPeakW ?? null,
    ec: state.exteriorColor ?? null,
    ic: state.interiorColor ?? null,
    loc: state.location ? {
      lat: state.location.latitude,
      lon: state.location.longitude,
      cid: state.location.cityId,
      cn: state.location.cityName,
      prov: state.location.province,
      psh: state.location.avgPeakSunHours,
      src: state.location.source,
    } : null,
    s: step,
  };
  const json = JSON.stringify(data);
  // base64url (semua karakter ASCII — hanya kode & angka)
  const b64 = btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64;
}

export function deserializeConfig(
  raw: string
): { config: ConfiguratorState; step: number } | null {
  try {
    let b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json = atob(b64);
    const d = JSON.parse(json) as Partial<ShareableState>;
    if (!d || !VEHICLE_TYPES.has(d.v as VehicleType)) return null;

    const appliances: Record<string, ApplianceSelection> = {};
    for (const [code, sel] of Object.entries(d.ap ?? {})) {
      if (!APPLIANCE_MAP.has(code)) continue;
      const qty = Math.max(1, Math.min(99, Math.round(Number(sel?.qty) || 1)));
      const hours = Math.min(24, Math.max(0.5, Number(sel?.hours) || 0.5));
      appliances[code] = { qty, hours };
    }

    const config: ConfiguratorState = {
      vehicleType: d.v as VehicleType,
      packageCode: d.p && OPTION_CODES.has(d.p) ? d.p : null,
      layoutCode: d.l && OPTION_CODES.has(d.l) ? d.l : null,
      materialCode: d.m && OPTION_CODES.has(d.m) ? d.m : null,
      addonCodes: Array.isArray(d.a) ? d.a.filter((c) => OPTION_CODES.has(c)) : [],
      appliances,
      includePlts: Boolean(d.plts),
      manualDailyWh:
        typeof d.mdwh === "number" && d.mdwh > 0 ? Math.round(d.mdwh) : undefined,
      manualPeakW:
        typeof d.mpw === "number" && d.mpw > 0 ? Math.round(d.mpw) : undefined,
      exteriorColor: d.ec && EXT_CODES.has(d.ec) ? d.ec : undefined,
      interiorColor: d.ic && INT_CODES.has(d.ic) ? d.ic : undefined,
      location: d.loc && typeof d.loc === "object" && typeof d.loc.lat === "number" && typeof d.loc.lon === "number" ? {
        latitude: d.loc.lat,
        longitude: d.loc.lon,
        cityId: d.loc.cid ?? "",
        cityName: d.loc.cn ?? "",
        province: d.loc.prov ?? "",
        avgPeakSunHours: typeof d.loc.psh === "number" ? d.loc.psh : 4.5,
        monthlyGhi: Array(12).fill(typeof d.loc.psh === "number" ? d.loc.psh : 4.5),
        source: d.loc.src === "api" ? "api" : "fallback",
      } : null,
    };
    const step =
      typeof d.s === "number" && d.s >= 0 && d.s <= 4 ? Math.floor(d.s) : 0;
    return { config, step };
  } catch {
    return null;
  }
}

export function shareUrl(config: ConfiguratorState, step: number): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?c=${serializeConfig(config, step)}`;
}
