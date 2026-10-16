"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  INDONESIAN_CITIES,
  type CityEntry,
  type LocationInfo,
} from "@/lib/solar-data";
import { useI18n } from "@/lib/i18n/provider";

type LocationPickerProps = {
  value: LocationInfo | null;
  onChange: (location: LocationInfo | null) => void;
};

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { t, lang } = useI18n();
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Filter kota berdasarkan pencarian
  const filteredCities = useMemo(() => {
    if (!search.trim()) {
      // Tampilkan kota populer dulu
      return INDONESIAN_CITIES.filter((c) =>
        ["jkt", "sby", "dps", "mks", "bdg", "smd", "ygy", "mlg"].includes(c.id)
      );
    }
    const q = search.toLowerCase();
    return INDONESIAN_CITIES.filter(
      (c) =>
        c.nameId.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q)
    );
  }, [search]);

  // Fetch data solar dari API
  const fetchSolarForCity = useCallback(
    async (city: CityEntry) => {
      setFetching(true);
      setGeoError(null);
      try {
        const res = await fetch(
          `/api/solar?city=${city.id}`
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data.location) {
          onChange(data.location);
        }
      } catch {
        // Fallback ke data lokal
        const fallback: LocationInfo = {
          latitude: city.lat,
          longitude: city.lon,
          cityId: city.id,
          cityName: lang === "id" ? city.nameId : city.nameEn,
          province: city.province,
          avgPeakSunHours: city.avgPsh,
          monthlyGhi: city.monthlyGhi,
          source: "fallback",
        };
        onChange(fallback);
      } finally {
        setFetching(false);
      }
    },
    [onChange, lang]
  );

  // Fetch solar data dari koordinat (geolocation)
  const fetchSolarForCoords = useCallback(
    async (lat: number, lon: number) => {
      setFetching(true);
      setGeoError(null);
      try {
        const res = await fetch(
          `/api/solar?lat=${lat}&lon=${lon}`
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data.location) {
          onChange(data.location);
        }
      } catch {
        setGeoError(
          lang === "id"
            ? "Gagal mengambil data surya. Menggunakan estimasi default."
            : "Failed to fetch solar data. Using default estimate."
        );
      } finally {
        setFetching(false);
      }
    },
    [onChange, lang]
  );

  // Geolocation handler
  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(
        lang === "id"
          ? "Browser tidak mendukung geolokasi"
          : "Browser does not support geolocation"
      );
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        fetchSolarForCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGeoLoading(false);
        setGeoError(
          lang === "id"
            ? "Izin lokasi ditolak. Pilih kota dari daftar."
            : "Location permission denied. Select a city from the list."
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchSolarForCoords, lang]);

  // Peta statis (OpenStreetMap tile)
  const mapUrl = value
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${value.latitude},${value.longitude}&zoom=10&size=600x300&maptype=mapnik&markers=${value.latitude},${value.longitude},red-pushpin`
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            📍 {t.solar.locationTitle}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {t.solar.locationHint}
          </p>
        </div>
        {value && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {value.source === "api" ? "📡 Live Data" : "📊 Estimasi"}
          </span>
        )}
      </div>

      {/* Search box */}
      <div className="mt-4 relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            lang === "id"
              ? "Cari kota atau provinsi..."
              : "Search city or province..."
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pl-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
        <svg
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Geolocation button */}
      <button
        type="button"
        onClick={handleGeolocation}
        disabled={geoLoading || fetching}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
      >
        {geoLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            {lang === "id" ? "Mencari lokasi..." : "Finding location..."}
          </>
        ) : (
          <>📍 {t.solar.useMyLocation}</>
        )}
      </button>

      {geoError && (
        <p className="mt-2 text-xs text-amber-600">{geoError}</p>
      )}

      {/* Daftar kota */}
      <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-slate-100">
        {filteredCities.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-400">
            {lang === "id" ? "Kota tidak ditemukan" : "City not found"}
          </div>
        ) : (
          filteredCities.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => fetchSolarForCity(city)}
              disabled={fetching}
              className={`flex w-full items-center justify-between border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:opacity-50 ${
                value?.cityId === city.id ? "bg-emerald-50" : ""
              }`}
            >
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {lang === "id" ? city.nameId : city.nameEn}
                </div>
                <div className="text-xs text-slate-400">{city.province}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-amber-600">
                  ☀️ {city.avgPsh} {t.solar.peakSunHoursShort}
                </div>
                <div className="text-[10px] text-slate-400">
                  {lang === "id" ? "estimasi" : "estimate"}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Info lokasi terpilih */}
      {value && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-emerald-800">
                📍 {value.cityName}
                {value.province && (
                  <span className="ml-1 font-normal text-emerald-600">
                    — {value.province}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-emerald-700">
                <span>
                  ☀️ {t.solar.peakSunHours}:{" "}
                  <b>{value.avgPeakSunHours} {t.solar.hoursPerDay}</b>
                </span>
                <span>
                  📐 {value.latitude.toFixed(4)}°, {value.longitude.toFixed(4)}°
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setSearch("");
              }}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100"
            >
              ✕
            </button>
          </div>

          {/* Mini chart GHI bulanan */}
          {value.monthlyGhi && value.monthlyGhi.length === 12 && (
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                {t.solar.monthlyGhiTitle}
              </div>
              <div className="mt-1.5 flex items-end gap-0.5" style={{ height: 48 }}>
                {value.monthlyGhi.map((ghi, i) => {
                  const max = Math.max(...value.monthlyGhi);
                  const h = max > 0 ? (ghi / max) * 100 : 0;
                  const monthLabel =
                    lang === "id"
                      ? ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]
                      : ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i];
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-emerald-400 to-amber-300 transition-all"
                        style={{ height: `${h}%`, minHeight: 2 }}
                        title={`${monthLabel}: ${ghi} kWh/m²/hari`}
                      />
                      <span className="text-[8px] text-emerald-600">
                        {monthLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toggle peta */}
      {value && (
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
        >
          🗺️ {showMap ? (lang === "id" ? "Sembunyikan Peta" : "Hide Map") : (lang === "id" ? "Lihat di Peta" : "Show on Map")}
        </button>
      )}

      {/* Peta */}
      {showMap && mapUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mapUrl}
            alt={`Map of ${value?.cityName ?? "location"}`}
            className="w-full object-cover"
            style={{ height: 200 }}
          />
        </div>
      )}
    </div>
  );
}
