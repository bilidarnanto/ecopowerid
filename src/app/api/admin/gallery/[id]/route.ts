import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

const schema = z.object({
  titleId: z.string().min(1).optional(),
  titleEn: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  featured: z.boolean().optional(),
  descriptionId: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/gallery/[id]">
) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  const d = parsed.data;
  try {
    const item = await prisma.galleryItem.update({
      where: { id },
      data: {
        ...(d.titleId !== undefined && { titleId: d.titleId }),
        ...(d.titleEn !== undefined && { titleEn: d.titleEn }),
        ...(d.category !== undefined && { category: d.category }),
        ...(d.featured !== undefined && { featured: d.featured }),
        ...(d.descriptionId !== undefined && { descriptionId: d.descriptionId }),
        ...(d.descriptionEn !== undefined && { descriptionEn: d.descriptionEn }),
        ...(d.sortOrder !== undefined && { sortOrder: d.sortOrder }),
      },
    });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/gallery/[id]">
) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const item = await prisma.galleryItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }
  await prisma.galleryItem.delete({ where: { id } });

  // Hapus file upload (kecuali seed placeholder yang dipakai bersama).
  // Upload disimpan di data/uploads; file seed berada di public/uploads.
  if (item.imagePath.startsWith("/uploads/") && !item.imagePath.includes("seed")) {
    const filename = item.imagePath.split("/").pop();
    if (filename) {
      unlink(path.join(process.cwd(), "data", "uploads", filename)).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true });
}
