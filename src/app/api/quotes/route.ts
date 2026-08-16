import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildRab, buildProvider, type ConfiguratorState } from "@/lib/rab";
import { siteConfig } from "@/lib/site-config";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  vehicleType: z.enum(["campervan", "motorhome", "foodtruck", "plts"]),
  config: z.any(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }

  const { name, email, phone, notes, vehicleType, config } = parsed.data;

  // Hitung ulang RAB di server dengan harga dari database (tidak percaya input client)
  const state: ConfiguratorState = {
    vehicleType,
    packageCode: config?.packageCode ?? null,
    layoutCode: config?.layoutCode ?? null,
    materialCode: config?.materialCode ?? null,
    addonCodes: Array.isArray(config?.addonCodes) ? config.addonCodes : [],
    appliances: config?.appliances ?? {},
    includePlts: Boolean(config?.includePlts),
    manualDailyWh: config?.manualDailyWh ?? undefined,
    manualPeakW: config?.manualPeakW ?? undefined,
  };

  const dbComponents = await prisma.component.findMany({ where: { isActive: true } });
  const provider = buildProvider(
    dbComponents.map((c) => ({
      code: c.code,
      nameId: c.nameId,
      nameEn: c.nameEn,
      category: c.category,
      unit: c.unit,
      price: c.price,
      specs: (c.specs as Record<string, unknown> | null) ?? null,
    }))
  );
  const rab = buildRab(state, provider);

  // Nomor referensi: EP-<tahun>-<urutan>
  const year = new Date().getFullYear();
  const last = await prisma.quote.findFirst({
    where: { reference: { startsWith: `EP-${year}-` } },
    orderBy: { createdAt: "desc" },
    select: { reference: true },
  });
  let seq = 1;
  if (last) {
    const num = parseInt(last.reference.split("-").pop() ?? "0", 10);
    if (!Number.isNaN(num)) seq = num + 1;
  }
  const reference = `EP-${year}-${String(seq).padStart(4, "0")}`;

  const quote = await prisma.quote.create({
    data: {
      reference,
      name,
      email,
      phone: phone || null,
      notes: notes || null,
      vehicleType,
      config: state as unknown as object,
      rab: { lines: rab.lines, totals: rab.totals } as unknown as object,
      totals: rab.totals as unknown as object,
      status: "BARU",
    },
  });

  return NextResponse.json({
    id: quote.id,
    reference: quote.reference,
    total: rab.totals.total,
    company: siteConfig.name,
  });
}
