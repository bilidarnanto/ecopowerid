// Katalog peralatan listrik untuk estimasi kebutuhan energi harian.
// `watts` = daya saat beroperasi (W), `hours` = jam pemakaian/hari (saran awal, dapat diubah user).

export type ApplianceDef = {
  code: string;
  nameId: string;
  nameEn: string;
  watts: number;
  hours: number;
};

export const APPLIANCES: ApplianceDef[] = [
  // Rumah tangga / kendaraan
  { code: "APL-LAMP", nameId: "Lampu LED", nameEn: "LED Light", watts: 5, hours: 5 },
  { code: "APL-FAN", nameId: "Kipas Angin", nameEn: "Fan", watts: 10, hours: 6 },
  { code: "APL-TV", nameId: "TV / Monitor", nameEn: "TV / Monitor", watts: 30, hours: 4 },
  { code: "APL-FRIDGE", nameId: "Kulkas 12V", nameEn: "12V Fridge", watts: 45, hours: 24 },
  { code: "APL-PUMP", nameId: "Pompa Air", nameEn: "Water Pump", watts: 40, hours: 1 },
  { code: "APL-LAPTOP", nameId: "Laptop", nameEn: "Laptop", watts: 65, hours: 4 },
  { code: "APL-PHONE", nameId: "HP / Gadget", nameEn: "Phone / Gadget", watts: 10, hours: 3 },
  { code: "APL-AC", nameId: "AC (½–¾ PK)", nameEn: "AC (0.5–0.75 HP)", watts: 500, hours: 8 },
  { code: "APL-RICECOOKER", nameId: "Rice Cooker", nameEn: "Rice Cooker", watts: 400, hours: 1 },
  { code: "APL-MICROWAVE", nameId: "Microwave", nameEn: "Microwave", watts: 800, hours: 0.5 },
  { code: "APL-WATERHEATER", nameId: "Pemanas Air", nameEn: "Water Heater", watts: 1200, hours: 0.5 },
  // Food truck / dapur jualan
  { code: "APL-FRYER", nameId: "Deep Fryer", nameEn: "Deep Fryer", watts: 2000, hours: 6 },
  { code: "APL-GRILL", nameId: "Grill / Bakar", nameEn: "Grill", watts: 1500, hours: 6 },
  { code: "APL-COFFEE", nameId: "Mesin Kopi", nameEn: "Coffee Machine", watts: 800, hours: 6 },
  { code: "APL-REFRIGDISPLAY", nameId: "Kulkas Display", nameEn: "Display Fridge", watts: 200, hours: 24 },
  { code: "APL-BLENDER", nameId: "Blender", nameEn: "Blender", watts: 350, hours: 1 },
  { code: "APL-TOASTER", nameId: "Toaster / Oven Kecil", nameEn: "Toaster / Mini Oven", watts: 800, hours: 2 },
  { code: "APL-FREEZER", nameId: "Freezer", nameEn: "Freezer", watts: 150, hours: 24 },
  { code: "APL-EXHAUST", nameId: "Exhaust / Blower Dapur", nameEn: "Kitchen Exhaust", watts: 200, hours: 6 },
];

export const APPLIANCE_MAP = new Map(APPLIANCES.map((a) => [a.code, a]));
