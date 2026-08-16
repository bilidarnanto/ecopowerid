import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/admin/prices/[id]">
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
    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  }

  const suggestion = await prisma.priceSuggestion.findUnique({ where: { id } });
  if (!suggestion) {
    return NextResponse.json({ error: "Saran tidak ditemukan" }, { status: 404 });
  }
  if (suggestion.status !== "PENDING") {
    return NextResponse.json(
      { error: "Saran ini sudah diproses sebelumnya" },
      { status: 409 }
    );
  }

  if (parsed.data.action === "approve") {
    await prisma.$transaction([
      prisma.priceSuggestion.update({
        where: { id },
        data: { status: "APPROVED", reviewedAt: new Date() },
      }),
      prisma.component.update({
        where: { id: suggestion.componentId },
        data: { price: suggestion.suggestedPrice, priceUpdatedAt: new Date() },
      }),
    ]);
  } else {
    await prisma.priceSuggestion.update({
      where: { id },
      data: { status: "REJECTED", reviewedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
