// ============================================================
// KONFIGURASI SITE — ubah di sini (atau via env) tanpa menyentuh kode lain
// ============================================================

export const siteConfig = {
  name: "EcoPower ID",
  taglineId: "Bengkel Konversi Campervan, Motorhome, Food Truck & Instalasi PLTS",
  taglineEn: "Campervan, Motorhome, Food Truck Conversion & Solar Power Systems",
  city: "Indonesia",
  phone: process.env.SITE_PHONE ?? "+62 812-3456-7890",
  whatsapp: process.env.SITE_WHATSAPP ?? "6281234567890",
  email: process.env.SITE_EMAIL ?? "halo@ecopower.id",
  addressId: process.env.SITE_ADDRESS_ID ?? "Jl. Contoh No. 1, Indonesia",
  addressEn: process.env.SITE_ADDRESS_EN ?? "Jl. Contoh No. 1, Indonesia",
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
