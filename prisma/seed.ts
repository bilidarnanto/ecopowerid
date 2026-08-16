import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedComponent = {
  code: string;
  nameId: string;
  nameEn: string;
  category: string;
  unit: string;
  price: number;
  specs?: Record<string, unknown>;
};

// Estimasi harga pasar Indonesia (IDR) — WAJIB diverifikasi & diperbarui admin.
const COMPONENTS: SeedComponent[] = [
  // ===== STRUKTUR — Paket konversi =====
  { code: "CV-PKG-STD", nameId: "Paket Konversi Campervan Standard", nameEn: "Campervan Standard Conversion Package", category: "STRUKTUR", unit: "paket", price: 45000000 },
  { code: "CV-PKG-DLX", nameId: "Paket Konversi Campervan Deluxe", nameEn: "Campervan Deluxe Conversion Package", category: "STRUKTUR", unit: "paket", price: 65000000 },
  { code: "CV-PKG-PRM", nameId: "Paket Konversi Campervan Premium", nameEn: "Campervan Premium Conversion Package", category: "STRUKTUR", unit: "paket", price: 90000000 },
  { code: "MH-PKG-STD", nameId: "Paket Konversi Motorhome Standard", nameEn: "Motorhome Standard Conversion Package", category: "STRUKTUR", unit: "paket", price: 120000000 },
  { code: "MH-PKG-DLX", nameId: "Paket Konversi Motorhome Deluxe", nameEn: "Motorhome Deluxe Conversion Package", category: "STRUKTUR", unit: "paket", price: 160000000 },
  { code: "MH-PKG-PRM", nameId: "Paket Konversi Motorhome Premium", nameEn: "Motorhome Premium Conversion Package", category: "STRUKTUR", unit: "paket", price: 210000000 },
  { code: "FT-PKG-STD", nameId: "Paket Food Truck Standard", nameEn: "Food Truck Standard Package", category: "STRUKTUR", unit: "paket", price: 55000000 },
  { code: "FT-PKG-DLX", nameId: "Paket Food Truck Deluxe", nameEn: "Food Truck Deluxe Package", category: "STRUKTUR", unit: "paket", price: 75000000 },
  { code: "FT-PKG-PRM", nameId: "Paket Food Truck Premium", nameEn: "Food Truck Premium Package", category: "STRUKTUR", unit: "paket", price: 100000000 },

  // ===== INTERIOR — Layout & material =====
  { code: "CV-LAY-1", nameId: "Layout Dapur + Sofa (2 orang)", nameEn: "Kitchen + Sofa Layout (2 people)", category: "INTERIOR", unit: "set", price: 8000000 },
  { code: "CV-LAY-2", nameId: "Layout Dapur + Double Bed (3-4 orang)", nameEn: "Kitchen + Double Bed Layout (3-4 people)", category: "INTERIOR", unit: "set", price: 12000000 },
  { code: "CV-LAY-3", nameId: "Layout Custom", nameEn: "Custom Layout", category: "INTERIOR", unit: "set", price: 10000000 },
  { code: "MH-LAY-1", nameId: "Layout 2 Kamar Tidur", nameEn: "2 Bedrooms Layout", category: "INTERIOR", unit: "set", price: 25000000 },
  { code: "MH-LAY-2", nameId: "Layout Kamar + Ruang Keluarga", nameEn: "Bedroom + Living Room Layout", category: "INTERIOR", unit: "set", price: 22000000 },
  { code: "MH-LAY-3", nameId: "Layout Custom", nameEn: "Custom Layout", category: "INTERIOR", unit: "set", price: 15000000 },
  { code: "FT-LAY-1", nameId: "Layout Dapur Sisi Kiri", nameEn: "Left-side Kitchen Layout", category: "INTERIOR", unit: "set", price: 7000000 },
  { code: "FT-LAY-2", nameId: "Layout Dapur Sisi Kanan", nameEn: "Right-side Kitchen Layout", category: "INTERIOR", unit: "set", price: 7000000 },
  { code: "FT-LAY-3", nameId: "Layout Custom", nameEn: "Custom Layout", category: "INTERIOR", unit: "set", price: 8000000 },
  { code: "MAT-HPL", nameId: "Material HPL (High Pressure Laminate)", nameEn: "HPL Material (High Pressure Laminate)", category: "INTERIOR", unit: "paket", price: 6500000 },
  { code: "MAT-PLY", nameId: "Material Plywood Lapis Finir", nameEn: "Veneered Plywood Material", category: "INTERIOR", unit: "paket", price: 4500000 },
  { code: "MAT-ALU", nameId: "Material Aluminium Composite", nameEn: "Aluminium Composite Material", category: "INTERIOR", unit: "paket", price: 8500000 },

  // ===== PERALATAN — Campervan =====
  { code: "CV-AD-AC", nameId: "AC 12V 12000 BTU", nameEn: "12V AC 12000 BTU", category: "PERALATAN", unit: "unit", price: 7500000 },
  { code: "CV-AD-FRIDGE", nameId: "Kulkas 12V 60L", nameEn: "12V Fridge 60L", category: "PERALATAN", unit: "unit", price: 4200000 },
  { code: "CV-AD-STOVE", nameId: "Kompor Gas 2 Tungku + Tabung", nameEn: "2-Burner Gas Stove + Tank", category: "PERALATAN", unit: "set", price: 1500000 },
  { code: "CV-AD-WATERHEATER", nameId: "Pemanas Air 12V", nameEn: "12V Water Heater", category: "PERALATAN", unit: "unit", price: 1800000 },
  { code: "CV-AD-TOILET", nameId: "Toilet Portable", nameEn: "Portable Toilet", category: "PERALATAN", unit: "unit", price: 1200000 },
  { code: "CV-AD-PUMP", nameId: "Pompa Air + Tangki 60L", nameEn: "Water Pump + 60L Tank", category: "PERALATAN", unit: "set", price: 2500000 },
  { code: "CV-AD-TV", nameId: "TV 24 inci + Mount", nameEn: "24-inch TV + Mount", category: "PERALATAN", unit: "set", price: 2200000 },
  { code: "CV-AD-ROOF", nameId: "Roof Rack", nameEn: "Roof Rack", category: "STRUKTUR", unit: "unit", price: 3500000 },
  { code: "CV-AD-AWNING", nameId: "Awning 2m", nameEn: "2m Awning", category: "STRUKTUR", unit: "unit", price: 2800000 },
  { code: "CV-AD-SOLARV", nameId: "Solar Vent", nameEn: "Solar Vent", category: "PERALATAN", unit: "unit", price: 1100000 },

  // ===== PERALATAN — Motorhome =====
  { code: "MH-AD-AC", nameId: "AC 220V 9000 BTU", nameEn: "220V AC 9000 BTU", category: "PERALATAN", unit: "unit", price: 6000000 },
  { code: "MH-AD-FRIDGE", nameId: "Kulkas Rumah Tangga 2 Pintu", nameEn: "2-Door Household Fridge", category: "PERALATAN", unit: "unit", price: 4500000 },
  { code: "MH-AD-WATERHEATER", nameId: "Pemanas Air Listrik", nameEn: "Electric Water Heater", category: "PERALATAN", unit: "unit", price: 1900000 },
  { code: "MH-AD-TOILET", nameId: "Toilet + Shower (Kamar Mandi Basah)", nameEn: "Toilet + Shower (Wet Bathroom)", category: "PERALATAN", unit: "set", price: 12000000 },
  { code: "MH-AD-SHOWER", nameId: "Shower Outdoor", nameEn: "Outdoor Shower", category: "PERALATAN", unit: "set", price: 2500000 },
  { code: "MH-AD-TV", nameId: "TV 32 inci + Mount", nameEn: "32-inch TV + Mount", category: "PERALATAN", unit: "set", price: 3000000 },
  { code: "MH-AD-ROOFAC", nameId: "AC Atap (Roof AC)", nameEn: "Roof AC", category: "PERALATAN", unit: "unit", price: 9500000 },
  { code: "MH-AD-AWNING", nameId: "Awning 3m", nameEn: "3m Awning", category: "STRUKTUR", unit: "unit", price: 4200000 },
  { code: "MH-AD-SOLARV", nameId: "Solar Vent", nameEn: "Solar Vent", category: "PERALATAN", unit: "unit", price: 1100000 },
  { code: "MH-AD-SMART", nameId: "Smart Home System", nameEn: "Smart Home System", category: "LISTRIK", unit: "set", price: 6500000 },

  // ===== PERALATAN — Food Truck =====
  { code: "FT-AD-FRYER", nameId: "Deep Fryer 2 Tabung", nameEn: "2-Basket Deep Fryer", category: "PERALATAN", unit: "unit", price: 3500000 },
  { code: "FT-AD-GRILL", nameId: "Grill / Griddle", nameEn: "Grill / Griddle", category: "PERALATAN", unit: "unit", price: 4000000 },
  { code: "FT-AD-COFFEE", nameId: "Mesin Kopi", nameEn: "Coffee Machine", category: "PERALATAN", unit: "unit", price: 8500000 },
  { code: "FT-AD-REFRIG", nameId: "Kulkas Display", nameEn: "Display Fridge", category: "PERALATAN", unit: "unit", price: 6500000 },
  { code: "FT-AD-FREEZER", nameId: "Freezer 200L", nameEn: "200L Freezer", category: "PERALATAN", unit: "unit", price: 4800000 },
  { code: "FT-AD-STOVE", nameId: "Kompor + Tabung", nameEn: "Stove + Tank", category: "PERALATAN", unit: "set", price: 1500000 },
  { code: "FT-AD-HOOD", nameId: "Exhaust Hood", nameEn: "Exhaust Hood", category: "PERALATAN", unit: "unit", price: 3200000 },
  { code: "FT-AD-WATER", nameId: "Sistem Air (Tangki + Pompa)", nameEn: "Water System (Tank + Pump)", category: "PERALATAN", unit: "set", price: 3800000 },
  { code: "FT-AD-AWNING", nameId: "Awning", nameEn: "Awning", category: "STRUKTUR", unit: "unit", price: 2800000 },
  { code: "FT-AD-SIGN", nameId: "LED Signage", nameEn: "LED Signage", category: "LISTRIK", unit: "set", price: 4500000 },

  // ===== PLTS — Panel surya =====
  { code: "PLTS-PANEL-100", nameId: "Panel Surya 100Wp", nameEn: "100Wp Solar Panel", category: "PLTS_PANEL", unit: "unit", price: 900000, specs: { wp: 100 } },
  { code: "PLTS-PANEL-200", nameId: "Panel Surya 200Wp", nameEn: "200Wp Solar Panel", category: "PLTS_PANEL", unit: "unit", price: 1600000, specs: { wp: 200 } },
  { code: "PLTS-PANEL-450", nameId: "Panel Surya 450Wp", nameEn: "450Wp Solar Panel", category: "PLTS_PANEL", unit: "unit", price: 2300000, specs: { wp: 450 } },
  { code: "PLTS-PANEL-550", nameId: "Panel Surya 550Wp", nameEn: "550Wp Solar Panel", category: "PLTS_PANEL", unit: "unit", price: 2800000, specs: { wp: 550 } },

  // ===== PLTS — Baterai LiFePO4 =====
  { code: "PLTS-BAT-100", nameId: "Baterai LiFePO4 12V 100Ah", nameEn: "LiFePO4 Battery 12V 100Ah", category: "PLTS_BATTERY", unit: "unit", price: 3800000, specs: { ah: 100, voltage: 12 } },
  { code: "PLTS-BAT-200", nameId: "Baterai LiFePO4 12V 200Ah", nameEn: "LiFePO4 Battery 12V 200Ah", category: "PLTS_BATTERY", unit: "unit", price: 7200000, specs: { ah: 200, voltage: 12 } },
  { code: "PLTS-BAT-300", nameId: "Baterai LiFePO4 12V 300Ah", nameEn: "LiFePO4 Battery 12V 300Ah", category: "PLTS_BATTERY", unit: "unit", price: 10500000, specs: { ah: 300, voltage: 12 } },

  // ===== PLTS — Inverter =====
  { code: "PLTS-INV-1000", nameId: "Inverter 1000W Pure Sine", nameEn: "1000W Pure Sine Inverter", category: "PLTS_INVERTER", unit: "unit", price: 1900000, specs: { watts: 1000 } },
  { code: "PLTS-INV-1500", nameId: "Inverter 1500W Pure Sine", nameEn: "1500W Pure Sine Inverter", category: "PLTS_INVERTER", unit: "unit", price: 2600000, specs: { watts: 1500 } },
  { code: "PLTS-INV-2000", nameId: "Inverter 2000W Pure Sine", nameEn: "2000W Pure Sine Inverter", category: "PLTS_INVERTER", unit: "unit", price: 3300000, specs: { watts: 2000 } },
  { code: "PLTS-INV-3000", nameId: "Inverter 3000W Pure Sine", nameEn: "3000W Pure Sine Inverter", category: "PLTS_INVERTER", unit: "unit", price: 4800000, specs: { watts: 3000 } },
  { code: "PLTS-INV-5000", nameId: "Inverter 5000W Pure Sine", nameEn: "5000W Pure Sine Inverter", category: "PLTS_INVERTER", unit: "unit", price: 7500000, specs: { watts: 5000 } },

  // ===== PLTS — Solar charge controller (MPPT) =====
  { code: "PLTS-SCC-30", nameId: "SCC MPPT 30A", nameEn: "MPPT SCC 30A", category: "PLTS_SCC", unit: "unit", price: 1400000, specs: { amps: 30 } },
  { code: "PLTS-SCC-40", nameId: "SCC MPPT 40A", nameEn: "MPPT SCC 40A", category: "PLTS_SCC", unit: "unit", price: 1900000, specs: { amps: 40 } },
  { code: "PLTS-SCC-60", nameId: "SCC MPPT 60A", nameEn: "MPPT SCC 60A", category: "PLTS_SCC", unit: "unit", price: 2900000, specs: { amps: 60 } },
  { code: "PLTS-SCC-80", nameId: "SCC MPPT 80A", nameEn: "MPPT SCC 80A", category: "PLTS_SCC", unit: "unit", price: 4200000, specs: { amps: 80 } },
  { code: "PLTS-SCC-100", nameId: "SCC MPPT 100A", nameEn: "MPPT SCC 100A", category: "PLTS_SCC", unit: "unit", price: 5500000, specs: { amps: 100 } },

  // ===== PLTS — BOS (Balance of System) =====
  { code: "PLTS-BOS-DC", nameId: "Kabel DC 6mm", nameEn: "DC Cable 6mm", category: "PLTS_BOS", unit: "meter", price: 25000 },
  { code: "PLTS-BOS-AC", nameId: "Kabel AC NYM 2.5mm", nameEn: "AC Cable NYM 2.5mm", category: "PLTS_BOS", unit: "meter", price: 12000 },
  { code: "PLTS-BOS-MC4", nameId: "Konektor MC4", nameEn: "MC4 Connector", category: "PLTS_BOS", unit: "pasang", price: 30000 },
  { code: "PLTS-BOS-FUSE", nameId: "Fuse & Holder", nameEn: "Fuse & Holder", category: "PLTS_BOS", unit: "set", price: 150000 },
  { code: "PLTS-BOS-DCBRK", nameId: "DC Breaker", nameEn: "DC Breaker", category: "PLTS_BOS", unit: "unit", price: 250000 },
  { code: "PLTS-BOS-ACBRK", nameId: "AC Breaker", nameEn: "AC Breaker", category: "PLTS_BOS", unit: "unit", price: 180000 },
  { code: "PLTS-BOS-BUSBAR", nameId: "Busbar & Distribusi", nameEn: "Busbar & Distribution", category: "PLTS_BOS", unit: "set", price: 350000 },
  { code: "PLTS-BOS-GND", nameId: "Kit Grounding", nameEn: "Grounding Kit", category: "PLTS_BOS", unit: "set", price: 400000 },
  { code: "PLTS-BOS-MOUNT", nameId: "Rakitan & Mounting", nameEn: "Racking & Mounting", category: "PLTS_BOS", unit: "set", price: 1200000 },
  { code: "PLTS-BOS-JBOX", nameId: "Junction Box", nameEn: "Junction Box", category: "PLTS_BOS", unit: "unit", price: 300000 },

  // ===== JASA =====
  { code: "PLTS-JASA-INSTALL", nameId: "Jasa Instalasi PLTS", nameEn: "Solar System Installation Service", category: "JASA", unit: "Wp", price: 2000 },
];

const GALLERY: {
  titleId: string;
  titleEn: string;
  category: string;
  imagePath: string;
  descriptionId: string;
  descriptionEn: string;
  featured: boolean;
}[] = [
  {
    titleId: "Campervan L300 Deluxe",
    titleEn: "L300 Deluxe Campervan",
    category: "campervan",
    imagePath: "/uploads/campervan.svg",
    descriptionId: "Konversi lengkap dengan dapur, double bed, dan PLTS 600Wp.",
    descriptionEn: "Full conversion with kitchen, double bed, and 600Wp solar.",
    featured: true,
  },
  {
    titleId: "Motorhome 2 Kamar",
    titleEn: "2-Bedroom Motorhome",
    category: "motorhome",
    imagePath: "/uploads/motorhome.svg",
    descriptionId: "Motorhome berbasis bus dengan kamar mandi basah dan AC.",
    descriptionEn: "Bus-based motorhome with wet bathroom and AC.",
    featured: true,
  },
  {
    titleId: "Coffee Truck Premium",
    titleEn: "Premium Coffee Truck",
    category: "foodtruck",
    imagePath: "/uploads/foodtruck.svg",
    descriptionId: "Coffee truck dengan mesin kopi, LED signage, dan PLTS 1200Wp.",
    descriptionEn: "Coffee truck with espresso machine, LED signage, and 1200Wp solar.",
    featured: false,
  },
  {
    titleId: "PLTS Atap Rumah 2200Wp",
    titleEn: "2200Wp Home Rooftop Solar",
    category: "plts",
    imagePath: "/uploads/plts.svg",
    descriptionId: "Instalasi PLTS on-grid 2200Wp untuk rumah tinggal.",
    descriptionEn: "2200Wp on-grid solar installation for a residence.",
    featured: false,
  },
];

async function main() {
  console.log("🌱 Seeding komponen katalog (insert-only, tidak menimpa data yang diedit admin)...");
  let inserted = 0;
  for (const c of COMPONENTS) {
    const exists = await prisma.component.findUnique({ where: { code: c.code } });
    if (exists) continue;
    await prisma.component.create({
      data: {
        code: c.code,
        nameId: c.nameId,
        nameEn: c.nameEn,
        category: c.category,
        unit: c.unit,
        price: c.price,
        ...(c.specs ? { specs: c.specs as Prisma.InputJsonValue } : {}),
      },
    });
    inserted += 1;
  }
  console.log(`✅ ${inserted} komponen baru (dari ${COMPONENTS.length} katalog).`);

  console.log("🌱 Seeding galeri contoh...");
  let galleryInserted = 0;
  for (const g of GALLERY) {
    const exists = await prisma.galleryItem.findUnique({ where: { id: `seed-${g.category}` } });
    if (exists) continue;
    await prisma.galleryItem.create({
      data: {
        id: `seed-${g.category}`,
        titleId: g.titleId,
        titleEn: g.titleEn,
        category: g.category,
        imagePath: g.imagePath,
        descriptionId: g.descriptionId,
        descriptionEn: g.descriptionEn,
        featured: g.featured,
      },
    });
    galleryInserted += 1;
  }
  console.log(`✅ ${galleryInserted} item galeri baru (dari ${GALLERY.length}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
