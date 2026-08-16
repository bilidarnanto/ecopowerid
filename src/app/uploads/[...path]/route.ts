import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

// Upload galeri disimpan di folder data (bukan public) agar file baru langsung
// bisa dilayani tanpa restart — server standalone hanya melayani file public
// yang sudah ada saat build.
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
// Fallback ke public/uploads untuk file seed (campervan.svg, dll) yang direferensikan galeri contoh.
const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/uploads/[...path]">
) {
  const { path: segments } = await ctx.params;
  const rel = Array.isArray(segments) ? segments.join("/") : String(segments ?? "");

  // Cegah path traversal
  if (!rel || rel.includes("..") || rel.includes("\\") || rel.startsWith("/")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  for (const base of [UPLOAD_DIR, PUBLIC_UPLOAD_DIR]) {
    const filepath = path.join(base, rel);
    try {
      const st = await stat(filepath);
      if (!st.isFile()) continue;
      const buf = await readFile(filepath);
      const ext = path.extname(filepath).toLowerCase();
      const headers: Record<string, string> = {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Content-Length": String(st.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        // Cegah browser menebak-nebak tipe konten (anti MIME-sniffing).
        "X-Content-Type-Options": "nosniff",
      };
      // SVG (hanya file seed dari repo, upload user sudah dilarang) tetap
      // dilayani dengan CSP sandbox agar script di dalamnya tak bisa jalan.
      if (ext === ".svg") {
        headers["Content-Security-Policy"] = "sandbox";
        headers["Content-Disposition"] = "inline";
      }
      return new NextResponse(new Uint8Array(buf), { headers });
    } catch {
      // lanjut ke lokasi berikutnya / 404
    }
  }

  return new NextResponse("Not Found", { status: 404 });
}
