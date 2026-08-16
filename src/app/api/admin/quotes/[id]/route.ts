import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

const schema = z.object({
  status: z.enum(["BARU", "DITINJAU", "DISETUJUI", "DITOLAK"]),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/quotes/[id]">
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
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }
  try {
    const quote = await prisma.quote.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json({ error: "Penawaran tidak ditemukan" }, { status: 404 });
  }
}
