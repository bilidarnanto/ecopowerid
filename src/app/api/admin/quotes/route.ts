import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

export async function GET(request: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const quotes = await prisma.quote.findMany({
    where: status && status !== "SEMUA" ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ quotes });
}
