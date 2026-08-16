import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";
import { isAiConfigured, suggestMarketPrices, type AiComponentInput } from "@/lib/ai";

export async function GET() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const suggestions = await prisma.priceSuggestion.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { component: true },
    take: 200,
  });
  return NextResponse.json({ suggestions });
}

export async function POST() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI belum dikonfigurasi. Set AI_BASE_URL, AI_API_KEY, AI_MODEL di .env." },
      { status: 400 }
    );
  }

  const components = await prisma.component.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });

  const inputs: AiComponentInput[] = components.map((c) => ({
    code: c.code,
    nameId: c.nameId,
    nameEn: c.nameEn,
    category: c.category,
    unit: c.unit,
    price: c.price,
  }));

  let suggestions;
  try {
    suggestions = await suggestMarketPrices(inputs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal menghubungi AI";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  let created = 0;
  for (const s of suggestions) {
    const component = components.find((c) => c.code === s.code);
    if (!component) continue;
    await prisma.priceSuggestion.create({
      data: {
        componentId: component.id,
        source: "ai",
        suggestedPrice: s.suggestedPrice,
        rangeLow: s.rangeLow,
        rangeHigh: s.rangeHigh,
        reasoning: s.reasoning,
        status: "PENDING",
      },
    });
    created += 1;
  }

  return NextResponse.json({ created });
}
