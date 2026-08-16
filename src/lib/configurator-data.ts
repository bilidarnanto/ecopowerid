// Struktur configurator: setiap pilihan mengacu ke kode komponen di database,
// sehingga harga mengikuti data yang dikelola admin.

export type ConfigOption = {
  code: string;
  labelId: string;
  labelEn: string;
  descId?: string;
  descEn?: string;
};

export type ConfigGroup = {
  key: string;
  labelId: string;
  labelEn: string;
  singleSelect: boolean; // true = pilih satu (radio), false = multi (checkbox)
  options: ConfigOption[];
};

export type VehicleType = "campervan" | "motorhome" | "foodtruck" | "plts";

export type VehicleConfig = {
  type: VehicleType;
  labelId: string;
  labelEn: string;
  emoji: string;
  descId: string;
  descEn: string;
  groups: ConfigGroup[];
};

const MATERIAL_OPTIONS: ConfigOption[] = [
  {
    code: "MAT-HPL",
    labelId: "HPL (High Pressure Laminate)",
    labelEn: "HPL (High Pressure Laminate)",
    descId: "Tahan gores, banyak pilihan motif",
    descEn: "Scratch resistant, many finishes",
  },
  {
    code: "MAT-PLY",
    labelId: "Plywood Lapis Finir",
    labelEn: "Veneered Plywood",
    descId: "Natural wood look, lebih ekonomis",
    descEn: "Natural wood look, more economical",
  },
  {
    code: "MAT-ALU",
    labelId: "Aluminium Composite",
    labelEn: "Aluminium Composite",
    descId: "Ringan & modern, cocok food truck",
    descEn: "Light & modern, great for food trucks",
  },
];

export const VEHICLE_CONFIGS: VehicleConfig[] = [
  {
    type: "campervan",
    labelId: "Campervan",
    labelEn: "Campervan",
    emoji: "🚐",
    descId: "Van konversi 1–4 orang (mis. L300, HiAce, Grand Max)",
    descEn: "Van conversion for 1–4 people (e.g. L300, HiAce, Grand Max)",
    groups: [
      {
        key: "package",
        labelId: "Paket Dasar Konversi",
        labelEn: "Base Conversion Package",
        singleSelect: true,
        options: [
          {
            code: "CV-PKG-STD",
            labelId: "Standard",
            labelEn: "Standard",
            descId: "Isolasi, panel interior, kelistrikan dasar, jendela bukaan",
            descEn: "Insulation, interior panels, basic electrical, opening windows",
          },
          {
            code: "CV-PKG-DLX",
            labelId: "Deluxe",
            labelEn: "Deluxe",
            descId: "Semua fitur Standard + finishing premium, rak atap, pencahayaan LED",
            descEn: "All Standard features + premium finish, roof rack, LED lighting",
          },
          {
            code: "CV-PKG-PRM",
            labelId: "Premium",
            labelEn: "Premium",
            descId: "Semua fitur Deluxe + pemanas air, sistem air lengkap, soundproofing",
            descEn: "All Deluxe features + water heater, full water system, soundproofing",
          },
        ],
      },
      {
        key: "layout",
        labelId: "Layout Interior",
        labelEn: "Interior Layout",
        singleSelect: true,
        options: [
          {
            code: "CV-LAY-1",
            labelId: "Dapur + Sofa (2 orang)",
            labelEn: "Kitchen + Sofa (2 people)",
            descId: "Dapur samping, sofa konversi jadi tempat tidur",
            descEn: "Side kitchen, sofa converts to bed",
          },
          {
            code: "CV-LAY-2",
            labelId: "Dapur + Double Bed (3–4 orang)",
            labelEn: "Kitchen + Double Bed (3–4 people)",
            descId: "Dapur lengkap + tempat tidur permanen atas",
            descEn: "Full kitchen + fixed upper double bed",
          },
          {
            code: "CV-LAY-3",
            labelId: "Custom Layout",
            labelEn: "Custom Layout",
            descId: "Diskusikan dengan tim desain kami",
            descEn: "Discuss with our design team",
          },
        ],
      },
      {
        key: "material",
        labelId: "Material Interior",
        labelEn: "Interior Material",
        singleSelect: true,
        options: MATERIAL_OPTIONS,
      },
      {
        key: "addons",
        labelId: "Tambahan (opsional)",
        labelEn: "Add-ons (optional)",
        singleSelect: false,
        options: [
          { code: "CV-AD-AC", labelId: "AC 12V", labelEn: "12V AC", descId: "AC kompresor 12V hemat energi" },
          { code: "CV-AD-FRIDGE", labelId: "Kulkas 12V 60L", labelEn: "12V Fridge 60L" },
          { code: "CV-AD-STOVE", labelId: "Kompor Gas + Tabung", labelEn: "Gas Stove + Tank" },
          { code: "CV-AD-WATERHEATER", labelId: "Pemanas Air", labelEn: "Water Heater" },
          { code: "CV-AD-TOILET", labelId: "Toilet Portable", labelEn: "Portable Toilet" },
          { code: "CV-AD-PUMP", labelId: "Pompa Air + Tangki", labelEn: "Water Pump + Tank" },
          { code: "CV-AD-TV", labelId: "TV + Mount", labelEn: "TV + Mount" },
          { code: "CV-AD-ROOF", labelId: "Roof Rack", labelEn: "Roof Rack" },
          { code: "CV-AD-AWNING", labelId: "Awning", labelEn: "Awning" },
          { code: "CV-AD-SOLARV", labelId: "Solar Vent", labelEn: "Solar Vent" },
        ],
      },
    ],
  },
  {
    type: "motorhome",
    labelId: "Motorhome",
    labelEn: "Motorhome",
    emoji: "🚌",
    descId: "Rumah berjalan 4–8 orang berbasis bus/truk",
    descEn: "Home on wheels for 4–8 people on bus/truck base",
    groups: [
      {
        key: "package",
        labelId: "Paket Dasar Konversi",
        labelEn: "Base Conversion Package",
        singleSelect: true,
        options: [
          {
            code: "MH-PKG-STD",
            labelId: "Standard",
            labelEn: "Standard",
            descId: "Isolasi penuh, interior, kelistrikan, sanitasi dasar",
            descEn: "Full insulation, interior, electrical, basic sanitation",
          },
          {
            code: "MH-PKG-DLX",
            labelId: "Deluxe",
            labelEn: "Deluxe",
            descId: "Standard + finishing premium, sistem air lengkap",
            descEn: "Standard + premium finish, full water system",
          },
          {
            code: "MH-PKG-PRM",
            labelId: "Premium",
            labelEn: "Premium",
            descId: "Deluxe + kamar mandi basah, AC multi, smart home",
            descEn: "Deluxe + wet bathroom, multi-zone AC, smart home",
          },
        ],
      },
      {
        key: "layout",
        labelId: "Layout Interior",
        labelEn: "Interior Layout",
        singleSelect: true,
        options: [
          {
            code: "MH-LAY-1",
            labelId: "2 Kamar Tidur",
            labelEn: "2 Bedrooms",
            descId: "Kamar depan & belakang + ruang keluarga",
            descEn: "Front & rear bedrooms + living room",
          },
          {
            code: "MH-LAY-2",
            labelId: "Kamar + Ruang Keluarga Luas",
            labelEn: "Bedroom + Large Living Room",
            descId: "Kamar belakang, ruang keluarga & dapur luas",
            descEn: "Rear bedroom, spacious living & kitchen",
          },
          {
            code: "MH-LAY-3",
            labelId: "Custom Layout",
            labelEn: "Custom Layout",
            descId: "Diskusikan dengan tim desain kami",
            descEn: "Discuss with our design team",
          },
        ],
      },
      {
        key: "material",
        labelId: "Material Interior",
        labelEn: "Interior Material",
        singleSelect: true,
        options: MATERIAL_OPTIONS,
      },
      {
        key: "addons",
        labelId: "Tambahan (opsional)",
        labelEn: "Add-ons (optional)",
        singleSelect: false,
        options: [
          { code: "MH-AD-AC", labelId: "AC 220V (via inverter)", labelEn: "220V AC (via inverter)" },
          { code: "MH-AD-FRIDGE", labelId: "Kulkas Rumah Tangga", labelEn: "Household Fridge" },
          { code: "MH-AD-WATERHEATER", labelId: "Pemanas Air", labelEn: "Water Heater" },
          { code: "MH-AD-TOILET", labelId: "Toilet + Shower", labelEn: "Toilet + Shower" },
          { code: "MH-AD-SHOWER", labelId: "Shower Outdoor", labelEn: "Outdoor Shower" },
          { code: "MH-AD-TV", labelId: "TV + Mount", labelEn: "TV + Mount" },
          { code: "MH-AD-ROOFAC", labelId: "AC Atap (Roof AC)", labelEn: "Roof AC" },
          { code: "MH-AD-AWNING", labelId: "Awning Besar", labelEn: "Large Awning" },
          { code: "MH-AD-SOLARV", labelId: "Solar Vent", labelEn: "Solar Vent" },
          { code: "MH-AD-SMART", labelId: "Smart Home System", labelEn: "Smart Home System" },
        ],
      },
    ],
  },
  {
    type: "foodtruck",
    labelId: "Food Truck",
    labelEn: "Food Truck",
    emoji: "🍔",
    descId: "Dapur jualan lengkap di atas roda (coffee, burger, fried chicken, dll)",
    descEn: "Full kitchen on wheels (coffee, burger, fried chicken, etc.)",
    groups: [
      {
        key: "package",
        labelId: "Paket Dasar",
        labelEn: "Base Package",
        singleSelect: true,
        options: [
          {
            code: "FT-PKG-STD",
            labelId: "Standard",
            labelEn: "Standard",
            descId: "Body, meja stainless, etalase, kelistrikan dasar",
            descEn: "Body, stainless counter, display case, basic electrical",
          },
          {
            code: "FT-PKG-DLX",
            labelId: "Deluxe",
            labelEn: "Deluxe",
            descId: "Standard + exhaust hood, wastafel, storage lengkap",
            descEn: "Standard + exhaust hood, sink, full storage",
          },
          {
            code: "FT-PKG-PRM",
            labelId: "Premium",
            labelEn: "Premium",
            descId: "Deluxe + finishing branding, LED signage, sound system",
            descEn: "Deluxe + branded finish, LED signage, sound system",
          },
        ],
      },
      {
        key: "layout",
        labelId: "Layout Dapur",
        labelEn: "Kitchen Layout",
        singleSelect: true,
        options: [
          {
            code: "FT-LAY-1",
            labelId: "Dapur Sisi Kiri",
            labelEn: "Left-side Kitchen",
            descId: "Area masak di sisi kiri, etalase jualan kanan",
            descEn: "Cooking area left, sales counter right",
          },
          {
            code: "FT-LAY-2",
            labelId: "Dapur Sisi Kanan",
            labelEn: "Right-side Kitchen",
            descId: "Area masak di sisi kanan, etalase jualan kiri",
            descEn: "Cooking area right, sales counter left",
          },
          {
            code: "FT-LAY-3",
            labelId: "Custom Layout",
            labelEn: "Custom Layout",
            descId: "Diskusikan dengan tim desain kami",
            descEn: "Discuss with our design team",
          },
        ],
      },
      {
        key: "material",
        labelId: "Material Body & Interior",
        labelEn: "Body & Interior Material",
        singleSelect: true,
        options: MATERIAL_OPTIONS,
      },
      {
        key: "addons",
        labelId: "Peralatan Dapur (opsional)",
        labelEn: "Kitchen Equipment (optional)",
        singleSelect: false,
        options: [
          { code: "FT-AD-FRYER", labelId: "Deep Fryer", labelEn: "Deep Fryer" },
          { code: "FT-AD-GRILL", labelId: "Grill / Griddle", labelEn: "Grill / Griddle" },
          { code: "FT-AD-COFFEE", labelId: "Mesin Kopi", labelEn: "Coffee Machine" },
          { code: "FT-AD-REFRIG", labelId: "Kulkas Display", labelEn: "Display Fridge" },
          { code: "FT-AD-FREEZER", labelId: "Freezer", labelEn: "Freezer" },
          { code: "FT-AD-STOVE", labelId: "Kompor + Tabung", labelEn: "Stove + Tank" },
          { code: "FT-AD-HOOD", labelId: "Exhaust Hood", labelEn: "Exhaust Hood" },
          { code: "FT-AD-WATER", labelId: "Sistem Air (tangki + pompa)", labelEn: "Water System (tank + pump)" },
          { code: "FT-AD-AWNING", labelId: "Awning", labelEn: "Awning" },
          { code: "FT-AD-SIGN", labelId: "LED Signage", labelEn: "LED Signage" },
        ],
      },
    ],
  },
  {
    type: "plts",
    labelId: "PLTS Rumahan / Lainnya",
    labelEn: "Home / Other Solar",
    emoji: "☀️",
    descId: "Sistem tenaga surya untuk rumah, usaha, atau aplikasi khusus",
    descEn: "Solar power systems for homes, businesses, or special applications",
    groups: [],
  },
];

// ------------------------------------------------------------------
// Perbandingan paket (STD / DLX / PRM) per tipe kendaraan
// ------------------------------------------------------------------

export type PackageTier = "std" | "dlx" | "prm";

export type PackageFeatureRow = {
  featureId: string;
  labelId: string;
  labelEn: string;
  tiers: Partial<Record<PackageTier, boolean>>;
};

export type PackageCompare = {
  tiers: { key: PackageTier; codePrefix: string; labelId: string; labelEn: string }[];
  features: PackageFeatureRow[];
};

const VEHICLE_COMPARE: Record<Exclude<VehicleType, "plts">, PackageCompare> = {
  campervan: {
    tiers: [
      { key: "std", codePrefix: "CV-PKG-STD", labelId: "Standard", labelEn: "Standard" },
      { key: "dlx", codePrefix: "CV-PKG-DLX", labelId: "Deluxe", labelEn: "Deluxe" },
      { key: "prm", codePrefix: "CV-PKG-PRM", labelId: "Premium", labelEn: "Premium" },
    ],
    features: [
      { featureId: "insul", labelId: "Isolasi dinding & atap", labelEn: "Wall & roof insulation", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "panel", labelId: "Panel interior dasar", labelEn: "Basic interior panels", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "elec", labelId: "Kelistrikan dasar (baterai + charger)", labelEn: "Basic electrical (battery + charger)", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "window", labelId: "Jendela bukaan", labelEn: "Opening windows", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "led", labelId: "Pencahayaan LED", labelEn: "LED lighting", tiers: { std: false, dlx: true, prm: true } },
      { featureId: "finish", labelId: "Finishing premium (HPL/aksen)", labelEn: "Premium finish (HPL/accent)", tiers: { std: false, dlx: true, prm: true } },
      { featureId: "rack", labelId: "Roof rack", labelEn: "Roof rack", tiers: { std: false, dlx: true, prm: true } },
      { featureId: "water", labelId: "Sistem air lengkap + pemanas air", labelEn: "Full water system + water heater", tiers: { std: false, dlx: false, prm: true } },
      { featureId: "sound", labelId: "Soundproofing", labelEn: "Soundproofing", tiers: { std: false, dlx: false, prm: true } },
    ],
  },
  motorhome: {
    tiers: [
      { key: "std", codePrefix: "MH-PKG-STD", labelId: "Standard", labelEn: "Standard" },
      { key: "dlx", codePrefix: "MH-PKG-DLX", labelId: "Deluxe", labelEn: "Deluxe" },
      { key: "prm", codePrefix: "MH-PKG-PRM", labelId: "Premium", labelEn: "Premium" },
    ],
    features: [
      { featureId: "insul", labelId: "Isolasi penuh", labelEn: "Full insulation", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "interior", labelId: "Interior + furnitur", labelEn: "Interior + furniture", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "elec", labelId: "Kelistrikan dasar", labelEn: "Basic electrical", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "sanitasi", labelId: "Sanitasi dasar", labelEn: "Basic sanitation", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "finish", labelId: "Finishing premium", labelEn: "Premium finish", tiers: { std: false, dlx: true, prm: true } },
      { featureId: "water", labelId: "Sistem air lengkap", labelEn: "Full water system", tiers: { std: false, dlx: true, prm: true } },
      { featureId: "bath", labelId: "Kamar mandi basah", labelEn: "Wet bathroom", tiers: { std: false, dlx: false, prm: true } },
      { featureId: "acmulti", labelId: "AC multi-zona", labelEn: "Multi-zone AC", tiers: { std: false, dlx: false, prm: true } },
      { featureId: "smart", labelId: "Smart home system", labelEn: "Smart home system", tiers: { std: false, dlx: false, prm: true } },
    ],
  },
  foodtruck: {
    tiers: [
      { key: "std", codePrefix: "FT-PKG-STD", labelId: "Standard", labelEn: "Standard" },
      { key: "dlx", codePrefix: "FT-PKG-DLX", labelId: "Deluxe", labelEn: "Deluxe" },
      { key: "prm", codePrefix: "FT-PKG-PRM", labelId: "Premium", labelEn: "Premium" },
    ],
    features: [
      { featureId: "body", labelId: "Body + meja stainless", labelEn: "Body + stainless counter", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "etalase", labelId: "Etalase display", labelEn: "Display case", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "elec", labelId: "Kelistrikan dasar", labelEn: "Basic electrical", tiers: { std: true, dlx: true, prm: true } },
      { featureId: "hood", labelId: "Exhaust hood", labelEn: "Exhaust hood", tiers: { std: false, dlx: true, prm: true } },
      { featureId: "wastafel", labelId: "Wastafel + storage lengkap", labelEn: "Sink + full storage", tiers: { std: false, dlx: true, prm: true } },
      { featureId: "branding", labelId: "Finishing branding", labelEn: "Branded finish", tiers: { std: false, dlx: false, prm: true } },
      { featureId: "sign", labelId: "LED signage", labelEn: "LED signage", tiers: { std: false, dlx: false, prm: true } },
      { featureId: "sound", labelId: "Sound system", labelEn: "Sound system", tiers: { std: false, dlx: false, prm: true } },
    ],
  },
};

export function getPackageCompare(type: VehicleType): PackageCompare | null {
  return VEHICLE_COMPARE[type as Exclude<VehicleType, "plts">] ?? null;
}

export const VEHICLE_MAP = new Map(VEHICLE_CONFIGS.map((v) => [v.type, v]));

// Preset kebutuhan energi untuk tipe PLTS rumahan (Wh/hari)
export const PLTS_PRESETS = [
  { code: "PLTS-RUMAH-600", labelId: "Hemat (600 Wp)", labelEn: "Basic (600 Wp)", dailyWh: 2000, peakW: 1200 },
  { code: "PLTS-RUMAH-1200", labelId: "Standar (1200 Wp)", labelEn: "Standard (1200 Wp)", dailyWh: 4000, peakW: 2500 },
  { code: "PLTS-RUMAH-2200", labelId: "Lengkap (2200 Wp)", labelEn: "Complete (2200 Wp)", dailyWh: 7500, peakW: 4000 },
] as const;
