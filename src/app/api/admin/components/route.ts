import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

const CATEGORIES = [
  "STRUKTUR",
  "INTERIOR",
  "PERALATAN",
  "PLTS_PANEL",
  "PLTS_BATTERY",
  "PLTS_INVERTER",
  "PLTS_SCC",
  "PLTS_BOS",
  "LISTRIK",
  "PLUMBING",
  "JASA",
] as const;

const schema = z.object({
  code: z.string().min(2).max(50).regex(/^[A-Z0-9-]+$/, "Kode hanya huruf besar, angka, dan tanda strip"),
  nameId: z.string().min(1),
  nameEn: z.string().min(1),
  category: z.enum(CATEGORIES),
  unit: z.string().min(1),
  price: z.number().positive(),
  specs: z.any().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const components = await prisma.component.findMany({
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });
  return NextResponse.json({ components });
}

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
  const d = parsed.data;
  try {
    const component = await prisma.component.create({
      data: {
        code: d.code,
        nameId: d.nameId,
        nameEn: d.nameEn,
        category: d.category,
        unit: d.unit,
        price: d.price,
        specs: d.specs ?? null,
        isActive: d.isActive ?? true,
      },
    });
    return NextResponse.json({ component });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique")) {
      return NextResponse.json({ error: "Kode sudah dipakai" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}
