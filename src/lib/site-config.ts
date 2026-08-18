// ============================================================
// KONFIGURASI SITE — ubah di sini (atau via env) tanpa menyentuh kode lain
// ============================================================
// Nextcloud asset server: https://nasbpfsby.duckdns.org
// Share link logo: https://nasbpfsby.duckdns.org/index.php/s/TPTap2XSxrzCdr2

export const siteConfig = {
  name: "EcoPower ID",
  taglineId: "Bengkel Konversi Campervan, Motorhome, Food Truck & Instalasi PLTS",
  taglineEn: "Campervan, Motorhome, Food Truck Conversion & Solar Power Systems",
  city: "Indonesia",
  phone: process.env.SITE_PHONE ?? "+62 853-3439-8681",
  whatsapp: process.env.SITE_WHATSAPP ?? "6285334398681",
  email: process.env.SITE_EMAIL ?? "projectigniter@gmail.com",
  addressId: process.env.SITE_ADDRESS_ID ?? "Perum Permata Indah A9 No.10, Kolursari, Sidowayah, Bangil, Pasuruan, Jawa Timur 67154, Indonesia",
  addressEn: process.env.SITE_ADDRESS_EN ?? "Perum Permata Indah A9 No.10, Kolursari, Sidowayah, Bangil, Pasuruan, East Java 67154, Indonesia",
  mapsUrl: "https://maps.app.goo.gl/7mhE1PYknyUX98vc8",
  currency: "IDR",
  locale: "id-ID",

  // Kebijakan penawaran (dapat diubah admin)
  marginPct: Number(process.env.RAB_MARGIN_PCT ?? 15), // margin bengkel %
  ppnPct: Number(process.env.RAB_PPN_PCT ?? 11), // PPN %
  includePpn: process.env.RAB_INCLUDE_PPN !== "false",

  // Asumsi kalkulasi PLTS
  plts: {
    sunHours: Number(process.env.PLTS_SUN_HOURS ?? 4.5), // jam puncak matahari (Indonesia)
    derating: 0.75, // efisiensi sistem (losses kabel, suhu, dll)
    batteryDoD: 0.8, // depth of discharge baterai LiFePO4
    batteryVoltage: 12, // tegangan bank baterai default
    inverterOversize: 1.25, // faktor keamanan inverter
    sccOversize: 1.25, // faktor keamanan solar charge controller
    jasaPerWp: Number(process.env.PLTS_JASA_PER_WP ?? 2000), // biaya jasa per Wp
  },
} as const;

export type SiteConfig = typeof siteConfig;
