import type { VehicleType } from "./configurator-data";
import type { RabLine } from "./rab";

// ------------------------------------------------------------------
// Tipe data
// ------------------------------------------------------------------

export type WorkStep = {
  id: number;
  phaseKey: string; // key untuk i18n: processStep1Title, processStep1Desc, dll
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  durationDays: number; // estimasi hari kerja tahap ini
  emoji: string;
  /** Apakah tahap ini relevan untuk konfigurasi ini */
  active: boolean;
};

export type ScheduleEntry = {
  week: number;
  phaseKey: string;
  titleId: string;
  titleEn: string;
  startDay: number;
  endDay: number;
  color: string;
};

export type WorkSchedule = {
  steps: WorkStep[];
  totalDays: number;
  schedule: ScheduleEntry[];
  /** Caption humanis untuk summary */
  summaryTextId: string;
  summaryTextEn: string;
};

// ------------------------------------------------------------------
// Durasi dasar per tahap (hari) — akan dikalikan/di-adjust
// ------------------------------------------------------------------

const BASE_DURATIONS: Record<number, number> = {
  1: 2,  // Konsultasi & Desain
  2: 3,  // Pengadaan Material
  3: 0,  // Struktur (dihitung dari workDays paket)
  4: 0,  // Interior (dihitung dari workDays layout)
  5: 2,  // Peralatan & Kelistrikan
  6: 2,  // Instalasi PLTS
  7: 2,  // Quality Check & Finishing
  8: 1,  // Serah Terima
};

// Warna untuk timeline
const STEP_COLORS = [
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-rose-500",
];

// ------------------------------------------------------------------
// Generator work steps
// ------------------------------------------------------------------

function getWorkDaysFromLines(lines: RabLine[]): number {
  return Math.max(
    0,
    ...lines.map((l) =>
      typeof l.specs?.workDays === "number" ? (l.specs.workDays as number) : 0
    )
  );
}

function getWarrantyMonthsFromLines(lines: RabLine[]): number {
  return Math.max(
    0,
    ...lines.map((l) =>
      typeof l.specs?.warrantyMonths === "number"
        ? (l.specs.warrantyMonths as number)
        : 0
    )
  );
}

export function buildWorkSchedule(
  vehicleType: VehicleType,
  lines: RabLine[],
  includePlts: boolean,
  addonCodes: string[],
  lang: "id" | "en"
): WorkSchedule {
  const totalWorkDays = getWorkDaysFromLines(lines);
  const warrantyMonths = getWarrantyMonthsFromLines(lines);

  // Hitung durasi untuk struktur & interior dari RAB lines
  const structureDays = Math.max(
    3, // minimum 3 hari untuk struktur
    ...lines
      .filter((l) => l.group === "STRUKTUR")
      .map((l) =>
        typeof l.specs?.workDays === "number" ? (l.specs.workDays as number) : 0
      )
  );
  const interiorDays = Math.max(
    2, // minimum 2 hari untuk interior
    ...lines
      .filter((l) => l.group === "INTERIOR")
      .map((l) =>
        typeof l.specs?.workDays === "number" ? (l.specs.workDays as number) : 0
      )
  );

  // Adjust PLTS duration berdasarkan jumlah panel
  const panelCount = lines
    .filter((l) => l.group === "PLTS" && l.code.includes("PANEL"))
    .reduce((s, l) => s + l.qty, 0);

  const steps: WorkStep[] = [
    {
      id: 1,
      phaseKey: "processStep1",
      titleId: "Konsultasi & Desain",
      titleEn: "Consultation & Design",
      descId: "Kita duduk bareng, ngobrol soal impianmu. Tim desain EcoPower akan membuat sketsa dan rencana teknis yang sesuai kebutuhanmu.",
      descEn: "We sit down together and talk about your vision. Our design team creates sketches and a technical plan tailored to your needs.",
      durationDays: 2,
      emoji: "💬",
      active: true,
    },
    {
      id: 2,
      phaseKey: "processStep2",
      titleId: "Pengadaan Material",
      titleEn: "Material Procurement",
      descId: "Material dan komponen dipilih dari supplier terpercaya. Setiap barang dicek kualitasnya sebelum masuk bengkel.",
      descEn: "Materials and components are sourced from trusted suppliers. Every item is quality-checked before entering our workshop.",
      durationDays: 3,
      emoji: "📦",
      active: true,
    },
    {
      id: 3,
      phaseKey: "processStep3",
      titleId: "Pengerjaan Struktur & Body",
      titleEn: "Structure & Body Work",
      descId: "Tahap inti — rangka dipotong, dilas, dan dibentuk. Insulasi dipasang untuk kenyamanan termal sepanjang perjalanan.",
      descEn: "The core phase — frame is cut, welded, and shaped. Insulation is installed for thermal comfort throughout your journey.",
      durationDays: structureDays,
      emoji: "🔧",
      active: true,
    },
    {
      id: 4,
      phaseKey: "processStep4",
      titleId: "Instalasi Interior & Furnitur",
      titleEn: "Interior & Furniture Installation",
      descId: "Dapur, lemari, tempat tidur, dan semua furnitur dipasang dengan teliti. Setiap detail diperhatikan — dari engsel hingga finishing.",
      descEn: "Kitchen, cabinets, bed, and all furniture are carefully installed. Every detail matters — from hinges to the final finish.",
      durationDays: interiorDays,
      emoji: "🪑",
      active: vehicleType !== "plts",
    },
    {
      id: 5,
      phaseKey: "processStep5",
      titleId: "Pemasangan Peralatan & Kelistrikan",
      titleEn: "Equipment & Electrical Installation",
      descId: "AC, kulkas, pompa air, dan peralatan lainnya dipasang. Sistem kelistrikan diwiring dengan aman oleh teknisi bersertifikat.",
      descEn: "AC, fridge, water pump, and other equipment are mounted. The electrical system is wired safely by certified technicians.",
      durationDays: addonCodes.length > 3 ? 3 : 2,
      emoji: "⚡",
      active: vehicleType !== "plts",
    },
    {
      id: 6,
      phaseKey: "processStep6",
      titleId: "Instalasi Sistem PLTS",
      titleEn: "Solar Power System Installation",
      descId: "Panel surya, inverter, baterai, dan kabel dipasang. Sistem diuji untuk memastikan aliran energi optimal.",
      descEn: "Solar panels, inverter, battery, and wiring are installed. The system is tested to ensure optimal energy flow.",
      durationDays: Math.max(2, Math.ceil(panelCount / 2) + 1),
      emoji: "☀️",
      active: includePlts || vehicleType === "plts",
    },
    {
      id: 7,
      phaseKey: "processStep7",
      titleId: "Quality Check & Finishing",
      titleEn: "Quality Check & Finishing",
      descId: "Setiap sudut diperiksa. Penyelesaian akhir — touch-up cat, sealant, dan pembersihan menyeluruh sebelum serah terima.",
      descEn: "Every corner is inspected. Final touches — paint touch-ups, sealant, and thorough cleaning before handover.",
      durationDays: 2,
      emoji: "✅",
      active: true,
    },
    {
      id: 8,
      phaseKey: "processStep8",
      titleId: "Serah Terima & Garansi",
      titleEn: "Handover & Warranty",
      descId: "Kendaraan diserahkan dengan panduan lengkap. Kamu mendapat garansi resmi dan akses ke tim support kami kapan saja.",
      descEn: "Your vehicle is delivered with a complete guide. You get an official warranty and access to our support team anytime.",
      durationDays: 1,
      emoji: "🎉",
      active: true,
    },
  ];

  // Hitung total hari
  const activeSteps = steps.filter((s) => s.active);
  const totalDays = activeSteps.reduce((s, step) => s + step.durationDays, 0);

  // Bangun schedule entries (timeline per minggu)
  const schedule: ScheduleEntry[] = [];
  let currentDay = 0;

  for (const step of activeSteps) {
    const startDay = currentDay + 1;
    const endDay = currentDay + step.durationDays;
    const startWeek = Math.ceil(startDay / 7);
    const endWeek = Math.ceil(endDay / 7);

    schedule.push({
      week: startWeek,
      phaseKey: step.phaseKey,
      titleId: step.titleId,
      titleEn: step.titleEn,
      startDay,
      endDay,
      color: STEP_COLORS[(step.id - 1) % STEP_COLORS.length],
    });

    currentDay = endDay;
  }

  // Summary text yang humanis
  const totalWeeks = Math.ceil(totalDays / 7);
  let summaryTextId: string;
  let summaryTextEn: string;

  if (totalDays <= 14) {
    summaryTextId = `Proyekmu diperkirakan selesai dalam ${totalWeeks}–${totalWeeks + 1} minggu. Waktu yang cukup untuk kualitas terbaik tanpa terburu-buru.`;
    summaryTextEn = `Your project is estimated to be completed in ${totalWeeks}–${totalWeeks + 1} weeks. Enough time for the best quality without rushing.`;
  } else if (totalDays <= 28) {
    summaryTextId = `Estimasi ${totalWeeks} minggu pengerjaan — proyek menengah dengan banyak detail yang dikerjakan secara paralel untuk efisiensi.`;
    summaryTextEn = `Estimated ${totalWeeks} weeks of work — a medium project with many details worked on in parallel for efficiency.`;
  } else {
    summaryTextId = `Proyek besar sekitar ${totalWeeks} minggu. Setiap tahap dikerjakan dengan teliti — kualitas tidak bisa dikompromi.`;
    summaryTextEn = `A major project of about ${totalWeeks} weeks. Every phase is done with care — quality cannot be compromised.`;
  }

  return {
    steps,
    totalDays,
    schedule,
    summaryTextId,
    summaryTextEn,
  };
}
