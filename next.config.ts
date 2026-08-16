import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone agar bisa dijalankan di container Docker tanpa node_modules penuh
  output: "standalone",
  // Route handler upload membaca file dari disk secara dinamis — file sumber & data
  // tidak perlu ikut ter-trace ke dalam output standalone (kode sudah di-bundle).
  outputFileTracingExcludes: {
    "/*": [
      "./src/**/*",
      "./prisma/**/*",
      "./data/**/*",
    ],
  },
};

export default nextConfig;
