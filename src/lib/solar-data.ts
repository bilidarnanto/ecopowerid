// ------------------------------------------------------------------
// Solar Data: Database kota Indonesia + integrasi Open-Meteo API
// untuk menghitung potensi perolehan daya surya berdasarkan lokasi
// ------------------------------------------------------------------

import { siteConfig } from "./site-config";

// ------------------------------------------------------------------
// Tipe data
// ------------------------------------------------------------------

export type LocationInfo = {
  latitude: number;
  longitude: number;
  cityId: string;
  cityName: string;
  province: string;
  /** Rata-rata peak sun hours per hari (rata-rata tahunan) */
  avgPeakSunHours: number;
  /** GHI bulanan (kWh/m²/hari) — 12 elemen (Jan–Des) */
  monthlyGhi: number[];
  /** Sumber data */
  source: "api" | "fallback";
};

// ------------------------------------------------------------------
// Database kota Indonesia (koordinat + estimasi PSH dari Global Solar Atlas)
// ------------------------------------------------------------------

export type CityEntry = {
  id: string;
  nameId: string;
  nameEn: string;
  province: string;
  lat: number;
  lon: number;
  /** Estimasi rata-rata peak sun hours (jam/hari) — dari Global Solar Atlas */
  avgPsh: number;
  /** GHI bulanan tipikal (kWh/m²/hari, Jan–Des) dari Global Solar Atlas */
  monthlyGhi: number[];
};

export const INDONESIAN_CITIES: CityEntry[] = [
  // ---- JAWA ----
  { id: "jkt", nameId: "Jakarta", nameEn: "Jakarta", province: "DKI Jakarta", lat: -6.2088, lon: 106.8456, avgPsh: 4.6, monthlyGhi: [4.2, 4.5, 5.0, 5.3, 5.1, 4.8, 4.9, 5.2, 5.4, 5.0, 4.5, 4.1] },
  { id: "sby", nameId: "Surabaya", nameEn: "Surabaya", province: "Jawa Timur", lat: -7.2575, lon: 112.7521, avgPsh: 4.8, monthlyGhi: [4.3, 4.6, 5.1, 5.4, 5.3, 5.0, 5.1, 5.3, 5.5, 5.1, 4.6, 4.2] },
  { id: "smd", nameId: "Semarang", nameEn: "Semarang", province: "Jawa Tengah", lat: -6.9666, lon: 110.4196, avgPsh: 4.7, monthlyGhi: [4.2, 4.5, 5.0, 5.3, 5.2, 4.9, 5.0, 5.2, 5.4, 5.0, 4.5, 4.1] },
  { id: "ygy", nameId: "Yogyakarta", nameEn: "Yogyakarta", province: "DI Yogyakarta", lat: -7.7956, lon: 110.3695, avgPsh: 4.7, monthlyGhi: [4.2, 4.5, 5.0, 5.3, 5.2, 4.9, 5.0, 5.2, 5.4, 5.0, 4.5, 4.1] },
  { id: "bdg", nameId: "Bandung", nameEn: "Bandung", province: "Jawa Barat", lat: -6.9175, lon: 107.6191, avgPsh: 4.5, monthlyGhi: [4.0, 4.3, 4.8, 5.1, 5.0, 4.7, 4.8, 5.0, 5.2, 4.8, 4.3, 3.9] },
  { id: "mlg", nameId: "Malang", nameEn: "Malang", province: "Jawa Timur", lat: -7.9666, lon: 112.6326, avgPsh: 4.8, monthlyGhi: [4.3, 4.6, 5.1, 5.4, 5.3, 5.0, 5.1, 5.3, 5.5, 5.1, 4.6, 4.2] },
  { id: "psr", nameId: "Pasuruan", nameEn: "Pasuruan", province: "Jawa Timur", lat: -7.6431, lon: 112.9073, avgPsh: 4.8, monthlyGhi: [4.3, 4.6, 5.1, 5.4, 5.3, 5.0, 5.1, 5.3, 5.5, 5.1, 4.6, 4.2] },
  { id: "smg", nameId: "Solo", nameEn: "Solo", province: "Jawa Tengah", lat: -7.5755, lon: 110.8243, avgPsh: 4.7, monthlyGhi: [4.2, 4.5, 5.0, 5.3, 5.2, 4.9, 5.0, 5.2, 5.4, 5.0, 4.5, 4.1] },

  // ---- SUMATERA ----
  { id: "mdn", nameId: "Medan", nameEn: "Medan", province: "Sumatera Utara", lat: 3.5952, lon: 98.6722, avgPsh: 4.4, monthlyGhi: [3.9, 4.2, 4.6, 4.8, 4.7, 4.5, 4.6, 4.8, 4.5, 4.3, 4.0, 3.8] },
  { id: "plb", nameId: "Palembang", nameEn: "Palembang", province: "Sumatera Selatan", lat: -2.9761, lon: 104.7754, avgPsh: 4.5, monthlyGhi: [4.0, 4.3, 4.8, 5.0, 4.9, 4.6, 4.7, 4.9, 4.7, 4.5, 4.1, 3.9] },
  { id: "bkl", nameId: "Bandar Lampung", nameEn: "Bandar Lampung", province: "Lampung", lat: -5.3971, lon: 105.2668, avgPsh: 4.6, monthlyGhi: [4.1, 4.4, 4.9, 5.2, 5.1, 4.8, 4.9, 5.1, 5.0, 4.7, 4.3, 4.0] },
  { id: "pkb", nameId: "Palembang", nameEn: "Pekanbaru", province: "Riau", lat: 0.5071, lon: 101.4478, avgPsh: 4.3, monthlyGhi: [3.8, 4.1, 4.5, 4.7, 4.6, 4.4, 4.5, 4.7, 4.4, 4.2, 3.9, 3.7] },
  { id: "bth", nameId: "Batam", nameEn: "Batam", province: "Kepulauan Riau", lat: 1.0456, lon: 104.0305, avgPsh: 4.4, monthlyGhi: [3.9, 4.2, 4.6, 4.8, 4.7, 4.5, 4.6, 4.8, 4.5, 4.3, 4.0, 3.8] },

  // ---- KALIMANTAN ----
  { id: "pnk", nameId: "Pontianak", nameEn: "Pontianak", province: "Kalimantan Barat", lat: -0.0263, lon: 109.3425, avgPsh: 4.3, monthlyGhi: [3.8, 4.1, 4.5, 4.7, 4.6, 4.4, 4.5, 4.7, 4.4, 4.2, 3.9, 3.7] },
  { id: "bjp", nameId: "Banjarmasin", nameEn: "Banjarmasin", province: "Kalimantan Selatan", lat: -3.3186, lon: 114.5944, avgPsh: 4.6, monthlyGhi: [4.1, 4.4, 4.9, 5.2, 5.1, 4.8, 4.9, 5.1, 5.0, 4.7, 4.3, 4.0] },
  { id: "dpk", nameId: "Balikpapan", nameEn: "Balikpapan", province: "Kalimantan Timur", lat: -1.2654, lon: 116.8311, avgPsh: 4.4, monthlyGhi: [3.9, 4.2, 4.6, 4.8, 4.7, 4.5, 4.6, 4.8, 4.5, 4.3, 4.0, 3.8] },
  { id: "mdw", nameId: "Manado", nameEn: "Manado", province: "Sulawesi Utara", lat: 1.4748, lon: 124.8421, avgPsh: 4.5, monthlyGhi: [4.0, 4.3, 4.8, 5.0, 4.9, 4.6, 4.7, 4.9, 4.7, 4.5, 4.1, 3.9] },

  // ---- SULAWESI ----
  { id: "mks", nameId: "Makassar", nameEn: "Makassar", province: "Sulawesi Selatan", lat: -5.1477, lon: 119.4327, avgPsh: 5.0, monthlyGhi: [4.5, 4.8, 5.3, 5.6, 5.5, 5.2, 5.3, 5.5, 5.7, 5.3, 4.8, 4.4] },
  { id: "plu", nameId: "Palu", nameEn: "Palu", province: "Sulawesi Tengah", lat: -0.8917, lon: 119.8707, avgPsh: 5.1, monthlyGhi: [4.6, 4.9, 5.4, 5.7, 5.6, 5.3, 5.4, 5.6, 5.8, 5.4, 4.9, 4.5] },
  { id: "krg", nameId: "Kendari", nameEn: "Kendari", province: "Sulawesi Tenggara", lat: -3.9984, lon: 122.5132, avgPsh: 4.9, monthlyGhi: [4.4, 4.7, 5.2, 5.5, 5.4, 5.1, 5.2, 5.4, 5.6, 5.2, 4.7, 4.3] },

  // ---- BALI & NUSA TENGGARA ----
  { id: "dps", nameId: "Denpasar", nameEn: "Denpasar", province: "Bali", lat: -8.6500, lon: 115.2167, avgPsh: 5.2, monthlyGhi: [4.7, 5.0, 5.5, 5.8, 5.7, 5.4, 5.5, 5.7, 5.9, 5.5, 5.0, 4.6] },
  { id: "mtr", nameId: "Mataram", nameEn: "Mataram", province: "Nusa Tenggara Barat", lat: -8.5833, lon: 116.1167, avgPsh: 5.3, monthlyGhi: [4.8, 5.1, 5.6, 5.9, 5.8, 5.5, 5.6, 5.8, 6.0, 5.6, 5.1, 4.7] },
  { id: "kpg", nameId: "Kupang", nameEn: "Kupang", province: "Nusa Tenggara Timur", lat: -10.1772, lon: 123.6070, avgPsh: 5.5, monthlyGhi: [5.0, 5.3, 5.8, 6.1, 6.0, 5.7, 5.8, 6.0, 6.2, 5.8, 5.3, 4.9] },

  // ---- PAPUA ----
  { id: "jpw", nameId: "Jayapura", nameEn: "Jayapura", province: "Papua", lat: -2.5916, lon: 140.6690, avgPsh: 4.4, monthlyGhi: [3.9, 4.2, 4.6, 4.8, 4.7, 4.5, 4.6, 4.8, 4.5, 4.3, 4.0, 3.8] },
  { id: "mks-p", nameId: "Merauke", nameEn: "Merauke", province: "Papua Selatan", lat: -8.4964, lon: 140.3958, avgPsh: 5.0, monthlyGhi: [4.5, 4.8, 5.3, 5.6, 5.5, 5.2, 5.3, 5.5, 5.7, 5.3, 4.8, 4.4] },
  { id: "srg", nameId: "Sorong", nameEn: "Sorong", province: "Papua Barat", lat: -0.8615, lon: 131.2535, avgPsh: 4.3, monthlyGhi: [3.8, 4.1, 4.5, 4.7, 4.6, 4.4, 4.5, 4.7, 4.4, 4.2, 3.9, 3.7] },

  // ---- MALUKU ----
  { id: "amb", nameId: "Ambon", nameEn: "Ambon", province: "Maluku", lat: -3.6954, lon: 128.1814, avgPsh: 4.6, monthlyGhi: [4.1, 4.4, 4.9, 5.2, 5.1, 4.8, 4.9, 5.1, 5.0, 4.7, 4.3, 4.0] },
  { id: "tli", nameId: "Ternate", nameEn: "Ternate", province: "Maluku Utara", lat: 0.7834, lon: 127.3813, avgPsh: 4.4, monthlyGhi: [3.9, 4.2, 4.6, 4.8, 4.7, 4.5, 4.6, 4.8, 4.5, 4.3, 4.0, 3.8] },
] as const;

export const CITY_MAP = new Map(INDONESIAN_CITIES.map((c) => [c.id, c]));

// ------------------------------------------------------------------
// Open-Meteo Solar API Client (gratis, tanpa API key)
// ------------------------------------------------------------------

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

/** Ambil data irradiance surya dari Open-Meteo untuk koordinat tertentu */
export async function fetchSolarData(
  latitude: number,
  longitude: number
): Promise<{ peakSunHours: number; monthlyGhi: number[] } | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      daily: "global_tilted_irradiance_sum",
      timezone: "Asia/Jakarta",
      forecast_days: "1",
    });

    const res = await fetch(`${OPEN_METEO_URL}?${params}`, {
      next: { revalidate: 86400 }, // cache 24 jam
    });

    if (!res.ok) return null;

    const data = await res.json();

    // GHI dalam MJ/m² → konversi ke kWh/m² (peak sun hours)
    const dailyGhiMj = data?.daily?.global_tilted_irradiance_sum?.[0];
    if (typeof dailyGhiMj !== "number") return null;

    // 1 kWh = 3.6 MJ, jadi PSH = GHI_MJ / 3.6
    const peakSunHours = Math.round((dailyGhiMj / 3.6) * 100) / 100;

    // Untuk data bulanan, kita gunakan estimasi dari koordinat
    // Open-Meteo tidak menyediakan data bulanan historis gratis,
    // jadi kita gunakan interpolasi dari database kota terdekat
    const monthlyGhi = estimateMonthlyGhi(latitude, longitude, peakSunHours);

    return { peakSunHours, monthlyGhi };
  } catch {
    return null;
  }
}

/** Estimasi GHI bulanan berdasarkan koordinat dan PSH aktual */
function estimateMonthlyGhi(
  lat: number,
  lon: number,
  actualPsh: number
): number[] {
  // Cari kota terdekat sebagai referensi pola bulanan
  let closestCity: CityEntry | null = null;
  let minDist = Infinity;

  for (const city of INDONESIAN_CITIES) {
    const d = Math.sqrt(
      Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2)
    );
    if (d < minDist) {
      minDist = d;
      closestCity = city;
    }
  }

  if (!closestCity) {
    // Fallback: distribusi merata
    return Array(12).fill(actualPsh);
  }

  // Scale pola bulanan dari kota referensi ke PSH aktual
  const refPsh = closestCity.avgPsh;
  const scale = refPsh > 0 ? actualPsh / refPsh : 1;

  return closestCity.monthlyGhi.map((ghi) =>
    Math.round(ghi * scale * 100) / 100
  );
}

// ------------------------------------------------------------------
// Fungsi utilitas
// ------------------------------------------------------------------

/** Cari kota berdasarkan ID */
export function getCityById(id: string): CityEntry | undefined {
  return CITY_MAP.get(id);
}

/** Cari kota terdekat dari koordinat */
export function findNearestCity(
  lat: number,
  lon: number
): CityEntry | undefined {
  let closest: CityEntry | undefined;
  let minDist = Infinity;

  for (const city of INDONESIAN_CITIES) {
    const d = Math.sqrt(
      Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2)
    );
    if (d < minDist) {
      minDist = d;
      closest = city;
    }
  }

  return closest;
}

/** Buat LocationInfo dari data kota + data API */
export function buildLocationInfo(
  city: CityEntry,
  apiData?: { peakSunHours: number; monthlyGhi: number[] } | null
): LocationInfo {
  if (apiData) {
    return {
      latitude: city.lat,
      longitude: city.lon,
      cityId: city.id,
      cityName: city.nameId,
      province: city.province,
      avgPeakSunHours: apiData.peakSunHours,
      monthlyGhi: apiData.monthlyGhi,
      source: "api",
    };
  }

  return {
    latitude: city.lat,
    longitude: city.lon,
    cityId: city.id,
    cityName: city.nameId,
    province: city.province,
    avgPeakSunHours: city.avgPsh,
    monthlyGhi: city.monthlyGhi,
    source: "fallback",
  };
}

/** Dapatkan sunHours untuk kalkulasi PLTS — pakai data lokasi atau default */
export function getSunHoursForLocation(
  location?: LocationInfo | null
): number {
  if (location && location.avgPeakSunHours > 0) {
    return location.avgPeakSunHours;
  }
  return siteConfig.plts.sunHours;
}

/** Format bulan dalam bahasa Indonesia */
export const MONTH_NAMES_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export const MONTH_NAMES_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
