import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

const schema = z.object({
  nameId: z.string().min(1).optional(),
  nameEn: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  specs: z.any().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/components/[code]">
) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { code } = await ctx.params;
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
    const component = await prisma.component.update({
      where: { code },
      data: {
        ...(d.nameId !== undefined && { nameId: d.nameId }),
        ...(d.nameEn !== undefined && { nameEn: d.nameEn }),
        ...(d.category !== undefined && { category: d.category }),
        ...(d.unit !== undefined && { unit: d.unit }),
        ...(d.price !== undefined && {
          price: d.price,
          priceUpdatedAt: new Date(),
        }),
        ...(d.specs !== undefined && { specs: d.specs }),
        ...(d.isActive !== undefined && { isActive: d.isActive }),
      },
    });
    return NextResponse.json({ component });
  } catch {
    return NextResponse.json({ error: "Komponen tidak ditemukan" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/components/[code]">
) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { code } = await ctx.params;
  try {
    await prisma.component.delete({ where: { code } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Komponen tidak ditemukan" }, { status: 404 });
  }
}
