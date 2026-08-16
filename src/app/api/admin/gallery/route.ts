import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth";

// File disimpan di data/uploads (bukan public) agar langsung dilayani via
// route handler dinamis /uploads/[...path] tanpa perlu restart server.
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

// Validasi isi file (magic bytes), bukan klaim `file.type` dari klien yang
// bisa dipalsukan. SVG sengaja TIDAK didukung untuk upload user: SVG bisa
// memuat <script> → risiko stored XSS saat dilayani inline. File SVG seed
// (public/uploads) tetap aman karena dikontrol repo, bukan upload.
type ImageKind = { ext: string; mime: string; sniff: (b: Uint8Array) => boolean };

const IMAGE_KINDS: ImageKind[] = [
  {
    ext: ".jpg",
    mime: "image/jpeg",
    sniff: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: ".png",
    mime: "image/png",
    sniff: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    ext: ".gif",
    mime: "image/gif",
    sniff: (b) =>
      b.length >= 6 &&
      String.fromCharCode(...b.slice(0, 6)) === "GIF89a",
  },
  {
    ext: ".webp",
    mime: "image/webp",
    sniff: (b) =>
      b.length >= 12 &&
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
  {
    ext: ".avif",
    mime: "image/avif",
    sniff: (b) => {
      if (b.length < 12) return false;
      const head = String.fromCharCode(...b.slice(4, 12));
      return head.startsWith("ftyp") && /avif|avis/.test(head.slice(4));
    },
  },
];

const SNIFF_ERR =
  "File bukan gambar yang valid (format: JPG, PNG, GIF, WebP, AVIF)";

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
  if (file.size === 0) {
    return NextResponse.json({ error: "File kosong" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran maksimal 8MB" }, { status: 400 });
  }

  // Baca seluruh isi dan sniff magic bytes — abaikan klaim MIME dari klien.
  const buffer = new Uint8Array(await file.arrayBuffer());
  const kind = IMAGE_KINDS.find((k) => k.sniff(buffer));
  if (!kind) {
    return NextResponse.json({ error: SNIFF_ERR }, { status: 400 });
  }

  const titleId = (form.get("titleId") as string)?.trim() || "Tanpa Judul";
  const titleEn = (form.get("titleEn") as string)?.trim() || titleId;
  const category = (form.get("category") as string) || "campervan";
  const featured = (form.get("featured") as string) === "true";
  const descriptionId = (form.get("descriptionId") as string)?.trim() || null;
  const descriptionEn = (form.get("descriptionEn") as string)?.trim() || null;

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${kind.ext}`;

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
