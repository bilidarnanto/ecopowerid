#!/bin/sh
set -e

echo "⏳ Menunggu database siap..."
node -e "
const t = setTimeout(() => { console.error('⏰ Timeout menunggu database'); process.exit(1); }, 120000);
const url = process.env.DATABASE_URL || '';
const m = url.match(/\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
if (!m) { console.log('DATABASE_URL tidak terisi, lanjut tanpa cek.'); clearTimeout(t); process.exit(0); }
const net = require('net');
function tryConn() {
  const s = net.connect(Number(m[4]), m[3], () => { clearTimeout(t); s.destroy(); console.log('✅ Database siap.'); process.exit(0); });
  s.on('error', () => { s.destroy(); setTimeout(tryConn, 2000); });
}
tryConn();
"

echo "🔄 Menjalankan migrasi database..."
node ./node_modules/prisma/build/index.js migrate deploy

# Seed data awal hanya jika diaktifkan (default: true). Insert-only — tidak menimpa
# harga atau data yang sudah diedit admin.
if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "🌱 Menjalankan seed data awal (insert-only)..."
  node --import tsx ./prisma/seed.ts
fi

echo "🚀 Memulai aplikasi EcoPower ID..."
exec "$@"
