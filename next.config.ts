import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone agar bisa dijalankan di container Docker tanpa node_modules penuh
  output: "standalone",
  // Route handler upload membaca file dari disk secara dinamis — file sumber & data
  // tidak perlu ikut ter-trace ke dalam output standalone (kode sudah di-bundle).
  // CATATAN: JANGAN exclude "./prisma/**/*" — pola itu ikut membuang hasil trace
  // klien Prisma (node_modules/.prisma) sehingga route API gagal di runtime.
  outputFileTracingExcludes: {
    "/*": [
      "./src/**/*",
      "./data/**/*",
    ],
  },
};

export default nextConfig;
