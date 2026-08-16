import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

// File disimpan di data/uploads (bukan public) agar langsung dilayani via
// route handler dinamis /uploads/[...path] tanpa perlu restart server.
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

export async function GET() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Form tidak valid" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File gambar wajib diisi" }, { status: 400 });
  }
  if (!EXT_BY_MIME[file.type]) {
    return NextResponse.json({ error: "Tipe file tidak didukung" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran maksimal 8MB" }, { status: 400 });
  }

  const titleId = (form.get("titleId") as string)?.trim() || "Tanpa Judul";
  const titleEn = (form.get("titleEn") as string)?.trim() || titleId;
  const category = (form.get("category") as string) || "campervan";
  const featured = (form.get("featured") as string) === "true";
  const descriptionId = (form.get("descriptionId") as string)?.trim() || null;
  const descriptionEn = (form.get("descriptionEn") as string)?.trim() || null;

  const ext = EXT_BY_MIME[file.type];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan file" }, { status: 500 });
  }

  const count = await prisma.galleryItem.count();
  const item = await prisma.galleryItem.create({
    data: {
      titleId,
      titleEn,
      category,
      imagePath: `/uploads/${filename}`,
      descriptionId,
      descriptionEn,
      featured,
      sortOrder: count,
    },
  });

  return NextResponse.json({ item });
}
