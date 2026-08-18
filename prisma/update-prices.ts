import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Harga pasar Surabaya / Jawa Timur — Agustus 2026
// Sumber: Tokopedia, Lazada, Shopee, toko lokal
const PRICE_UPDATES: Record<string, number> = {
  // ===== STRUKTUR =====
  "CV-PKG-STD": 48_000_000,
  "CV-PKG-DLX": 72_000_000,
  "CV-PKG-PRM": 110_000_000,
  "MH-PKG-STD": 150_000_000,
  "MH-PKG-DLX": 195_000_000,
  "MH-PKG-PRM": 260_000_000,
  "FT-PKG-STD": 58_000_000,
  "FT-PKG-DLX": 80_000_000,
  "FT-PKG-PRM": 105_000_000,

  // ===== INTERIOR =====
  "CV-LAY-1": 8_500_000,
  "CV-LAY-2": 13_000_000,
  "CV-LAY-3": 10_000_000,
  "MH-LAY-1": 26_000_000,
  "MH-LAY-2": 23_000_000,
  "MH-LAY-3": 15_000_000,
  "FT-LAY-1": 7_500_000,
  "FT-LAY-2": 7_500_000,
  "FT-LAY-3": 8_500_000,
  "MAT-HPL": 7_000_000,
  "MAT-PLY": 5_000_000,
  "MAT-ALU": 9_000_000,

  // ===== PERALATAN CAMPERVAN =====
  "CV-AD-AC": 7_500_000,
  "CV-AD-FRIDGE": 4_500_000,
  "CV-AD-STOVE": 1_500_000,
  "CV-AD-WATERHEATER": 1_800_000,
  "CV-AD-TOILET": 1_200_000,
  "CV-AD-PUMP": 2_500_000,
  "CV-AD-TV": 2_200_000,
  "CV-AD-ROOF": 3_500_000,
  "CV-AD-AWNING": 2_800_000,
  "CV-AD-SOLARV": 1_100_000,

  // ===== PERALATAN MOTORHOME =====
  "MH-AD-AC": 6_000_000,
  "MH-AD-FRIDGE": 4_800_000,
  "MH-AD-WATERHEATER": 2_000_000,
  "MH-AD-TOILET": 12_500_000,
  "MH-AD-SHOWER": 2_500_000,
  "MH-AD-TV": 3_200_000,
  "MH-AD-ROOFAC": 9_500_000,
  "MH-AD-AWNING": 4_500_000,
  "MH-AD-SOLARV": 1_100_000,
  "MH-AD-SMART": 6_500_000,

  // ===== PERALATAN FOOD TRUCK =====
  "FT-AD-FRYER": 3_800_000,
  "FT-AD-GRILL": 4_200_000,
  "FT-AD-COFFEE": 8_500_000,
  "FT-AD-REFRIG": 6_500_000,
  "FT-AD-FREEZER": 5_000_000,
  "FT-AD-STOVE": 1_500_000,
  "FT-AD-HOOD": 3_500_000,
  "FT-AD-WATER": 4_000_000,
  "FT-AD-AWNING": 2_800_000,
  "FT-AD-SIGN": 4_500_000,

  // ===== PLTS — Panel =====
  "PLTS-PANEL-100": 950_000,
  "PLTS-PANEL-200": 1_650_000,
  "PLTS-PANEL-450": 2_300_000,
  "PLTS-PANEL-550": 2_800_000,

  // ===== PLTS — Baterai LiFePO4 =====
  "PLTS-BAT-100": 2_500_000,
  "PLTS-BAT-200": 4_800_000,
  "PLTS-BAT-300": 7_200_000,

  // ===== PLTS — Inverter =====
  "PLTS-INV-1000": 1_500_000,
  "PLTS-INV-1500": 2_200_000,
  "PLTS-INV-2000": 2_800_000,
  "PLTS-INV-3000": 4_200_000,
  "PLTS-INV-5000": 6_500_000,

  // ===== PLTS — SCC =====
  "PLTS-SCC-30": 1_400_000,
  "PLTS-SCC-40": 1_900_000,
  "PLTS-SCC-60": 2_900_000,
  "PLTS-SCC-80": 4_200_000,
  "PLTS-SCC-100": 5_500_000,

  // ===== PLTS — BOS =====
  "PLTS-BOS-DC": 25_000,
  "PLTS-BOS-AC": 12_000,
  "PLTS-BOS-MC4": 30_000,
  "PLTS-BOS-FUSE": 150_000,
  "PLTS-BOS-DCBRK": 250_000,
  "PLTS-BOS-ACBRK": 180_000,
  "PLTS-BOS-BUSBAR": 350_000,
  "PLTS-BOS-GND": 400_000,
  "PLTS-BOS-MOUNT": 1_200_000,
  "PLTS-BOS-JBOX": 300_000,

  // ===== JASA =====
  "PLTS-JASA-INSTALL": 2_000,
};

async function main() {
  console.log("🔄 Updating component prices (Surabaya market, Aug 2026)...\n");

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const [code, newPrice] of Object.entries(PRICE_UPDATES)) {
    const component = await prisma.component.findUnique({ where: { code } });
    if (!component) {
      console.log(`  ⚠️  ${code} — tidak ditemukan di DB, skip`);
      notFound++;
      continue;
    }

    if (component.price === newPrice) {
      skipped++;
      continue;
    }

    const oldPrice = component.price;
    await prisma.component.update({
      where: { code },
      data: { price: newPrice, priceUpdatedAt: new Date() },
    });

    const diff = newPrice - oldPrice;
    const pct = ((diff / oldPrice) * 100).toFixed(1);
    const arrow = diff > 0 ? "📈" : diff < 0 ? "📉" : "➡️";
    console.log(
      `  ${arrow} ${code}: Rp ${oldPrice.toLocaleString("id-ID")} → Rp ${newPrice.toLocaleString("id-ID")} (${pct}%)`
    );
    updated++;
  }

  console.log(`\n✅ Selesai: ${updated} diupdate, ${skipped} sama, ${notFound} tidak ditemukan`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
