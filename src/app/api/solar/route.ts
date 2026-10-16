// API route: /api/solar?lat=...&lon=...
// Proxy ke Open-Meteo Solar API — mengembalikan data irradiance surya
// untuk lokasi yang dipilih customer.

import { fetchSolarData, getCityById, findNearestCity, buildLocationInfo } from "@/lib/solar-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const cityId = searchParams.get("city");

  // Jika cityId diberikan, ambil dari database lokal
  if (cityId) {
    const city = getCityById(cityId);
    if (city) {
      // Coba ambil data API juga
      let apiData = null;
      try {
        apiData = await fetchSolarData(city.lat, city.lon);
      } catch {
        // abaikan error API
      }
      const location = buildLocationInfo(city, apiData);
      return Response.json({ location, city });
    }
  }

  // Jika lat/lon diberikan
  if (latParam && lonParam) {
    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return Response.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    // Cari kota terdekat
    const nearestCity = findNearestCity(lat, lon);

    // Fetch data dari Open-Meteo
    let apiData = null;
    try {
      apiData = await fetchSolarData(lat, lon);
    } catch {
      // abaikan error API
    }

    // Bangun info lokasi
    if (nearestCity) {
      const location = buildLocationInfo(nearestCity, apiData);
      return Response.json({ location, city: nearestCity });
    }

    // Jika tidak ada kota terdekat (shouldn't happen for Indonesia)
    return Response.json({
      location: {
        latitude: lat,
        longitude: lon,
        cityId: "unknown",
        cityName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        province: "",
        avgPeakSunHours: apiData?.peakSunHours ?? 4.5,
        monthlyGhi: apiData?.monthlyGhi ?? Array(12).fill(4.5),
        source: apiData ? "api" : "fallback",
      },
      city: null,
    });
  }

  // Jika tidak ada parameter, kembalikan daftar kota
  return Response.json({
    cities: (await import("@/lib/solar-data")).INDONESIAN_CITIES.map((c) => ({
      id: c.id,
      nameId: c.nameId,
      nameEn: c.nameEn,
      province: c.province,
      lat: c.lat,
      lon: c.lon,
      avgPsh: c.avgPsh,
    })),
  });
}
