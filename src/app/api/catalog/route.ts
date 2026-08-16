import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const components = await prisma.component.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { code: "asc" }],
    select: {
      code: true,
      nameId: true,
      nameEn: true,
      category: true,
      unit: true,
      price: true,
      specs: true,
      priceUpdatedAt: true,
    },
  });
  return NextResponse.json({ components });
}
