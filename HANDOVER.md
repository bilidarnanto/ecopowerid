# 📋 Handover — Catatan Sesi

> Dokumen ini mencatat pekerjaan yang sudah dilakukan dan kondisi proyek saat ini,
> agar sesi berikutnya bisa langsung lanjut tanpa harus menyelidiki ulang.
> Terakhir diperbarui: 16 Agustus 2026.

---

## 1. Pekerjaan yang Sudah Selesai (sesi terakhir)

### 1.1 Fitur Sketsa 3D di Configurator ✅
- **`src/components/VehicleSketch.tsx`** (baru) — sketsa isometrik SVG, tanpa dependency baru.
  Bentuk kendaraan berubah mengikuti pilihan: tipe (campervan/motorhome/food truck/PLTS),
  paket, layout, material, add-on; ada aksen warna brand.
- **`src/app/konfigurator/page.tsx`** — panel **"Pratinjau 3D"** sticky di kolom kanan (desktop),
  di atas (mobile); tampil setelah tipe kendaraan dipilih.
- **`src/lib/i18n/dictionaries.ts`** — kunci `preview`, `previewHint`, `selectVehicleHint` (ID/EN).
- Tombol **"Lanjut"** sekarang memvalidasi: tidak bisa lanjut sebelum tipe dipilih
  (ada hint "Pilih tipe kendaraan untuk mulai…").

### 1.2 Repositori GitHub ✅
- Repo **private** dibuat & di-push: `bestprofitsurabaya/ecopowerid` (branch `main`).
- Kredensial GitHub ditemukan di **`/home/it-ef/.git-credentials`** (akun `bestprofitsurabaya`),
  dipakai juga oleh proyek `bpf-workhub` & `bpf-asset-system`.
- Remote lokal: `origin` → `https://github.com/bestprofitsurabaya/ecopowerid.git`.
  Branch lokal **`master`** di-set upstream ke `origin/main`; push cukup `git push`.
- `.gitignore` sudah aman: `.env`, `.next`, `data/`, `node_modules` tidak ikut ter-commit.

### 1.3 Akses Publik via Router MikroTik RB1100 ✅
- Router: **RB1100AHx2** di `192.168.100.1` (SSH & Winbox terbuka; kredensial ada di catatan internal).
- WAN: `pppoe-biznet` dengan IP publik **`182.253.62.194`**; host server `192.168.100.234` (ether10).
- Ditambahkan rule NAT baru: **`FW-EcoPower-Port-3000`** — dst-nat dari WAN port 3000
  → `192.168.100.234:3000` (rule terpisah, tidak mengubah rule `FW-All-Ports` yang sudah ada).
- Firewall input WAN = drop; forward rule 6 accept ke host ini — sudah aman.
- Verifikasi eksternal: port `182.253.62.194:3000` **terbuka** (port-check `status: true`).
- ⚠️ Belum ada domain/HTTPS — akses publik masih `http://<IP>:3000` (lihat §5).

### 1.4 Pembersihan & Dockerisasi Penuh ✅
Proyek kini **100% berjalan via Docker**; tidak ada proses Node di host:
- Dimatikan proses liar: `next-server` standalone lama (port 3100, dir `.next/standalone (deleted)`).
- Dihapus container sampah: `ecopower-orig3` (container tes) & `ecopower-pg`
  (postgres standalone — data sudah terverifikasi ada di compose `db`, 79 komponen).
- Dihapus image lama/rusak (`ecopower-app`, image pra-fix, build rusak).
- Container proyek lain (karaoke, bbm, nextcloud) **tidak disentuh**.

### 1.5 Perbaikan Kritis: Trace Prisma Hilang di Build Standalone ✅
- **Gejala:** semua route API (catalog, admin) 500 di container:
  `Failed to load external module @prisma/client-2c3a283f134fdcb6: Cannot find module ...`
- **Akar masalah:** `outputFileTracingExcludes` di `next.config.ts` berisi `"./prisma/**/*"`.
  Pola itu ikut membuang hasil trace klien Prisma (`node_modules/.prisma`, `node_modules/@prisma/*`)
  dari output standalone → `.next/node_modules/@prisma/client-<hash>` tidak pernah dibuat.
- **Perbaikan:** hapus `"./prisma/**/*"` dari excludes (commit `ac5e7b9`). `./src/**/*` dan
  `./data/**/*` tetap dikecualikan. Komentar peringatan sudah ditulis di `next.config.ts`.
- **⚠️ JANGAN** menambahkan `"./prisma/**/*"` ke `outputFileTracingExcludes` lagi.

---

## 2. Kondisi Sekarang (running state)

| Item | Status |
|---|---|
| Container aktif | `ecopowerid-app-1` (port 3000) + `ecopowerid-db-1` (postgres:16-alpine, healthy) |
| Image app | `ecopowerid-app:latest` (standalone, ±1.13 GB) — build dengan fix trace Prisma |
| Volume | `pgdata` (DB) + `uploads` (foto galeri → `data/uploads`) |
| `GET /api/catalog` | 200 (79 komponen) |
| `/konfigurator` | 200, memuat "Pratinjau 3D" |
| `/admin` | 307 → `/admin/login` (terproteksi sesi) |
| Akses publik | `http://182.253.62.194:3000` terbuka |
| `.env` | `ADMIN_PASSWORD` & `SESSION_SECRET` terisi (kuat); `DATABASE_URL` di-override compose ke `db:5432` |
| Git | `ac5e7b9` ter-push; working tree bersih |

## 3. Perintah yang Sering Dipakai

```bash
# Rebuild & deploy (npm ci di-cache, ±3 menit)
docker compose up -d --build

# Cek log / status
docker logs ecopowerid-app-1 --tail 20
docker ps

# Tes cepat
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/catalog
curl -s http://localhost:3000/konfigurator | grep -o "Pratinjau 3D" | head -1

# Build lokal (untuk debug cepat; output standalone di .next/standalone)
npm run build
# Verifikasi trace prisma ada (WAJIB ada!):
ls .next/standalone/.next/node_modules/@prisma/   # → client-<hash> harus muncul

# Typecheck
npx tsc --noEmit
```

## 4. Jebakan & Pelajaran (hindari terulang)

1. **Jangan jalankan `npm run build` di host saat `next dev`/container aktif** — build memakai
   `.next` bersama dan bisa merusak state (sumber masalah besar sesi ini).
2. **`docker compose build` bisa hang tanpa output di filesystem server ini** — kalau hang,
   pakai `docker build -t ecopowerid-app:new .` langsung + `setsid nohup ... &` lalu poll log.
   Build `--no-cache` ±8 menit; build dengan cache ±4 menit.
3. **`outputFileTracingExcludes`** — jangan pernah exclude `./prisma/**/*` (lihat §1.5).
4. Port 3000 dilayani oleh **container compose**; jangan start `next dev`/`next start` manual di host.
5. Kredensial router/GitHub tersimpan di file proyek lain server ini — jangan commit ke repo.

## 5. Langkah Berikutnya yang Disarankan (belum dikerjakan)

- [ ] **Domain + HTTPS** — pasang reverse proxy (nginx/caddy) di depan port 3000 + Let's Encrypt,
      agar akses publik tidak lewat `http://IP:port` telanjang. Perlu DNS A record → `182.253.62.194`
      (atau DDNS), lalu tambah dst-nat 80/443 di router RB1100.
- [ ] **Hardening keamanan** — rate-limit endpoint login admin, validasi tipe file upload galeri,
      security headers (CSP, HSTS), proteksi `docker-entrypoint.sh` seed agar tidak jalan tiap start.
- [ ] **Backup DB terjadwal** — `pg_dump` volume `pgdata` (mis. cron harian), karena data admin
      (harga, penawaran, galeri) hanya ada di DB.
- [ ] **README** — tambahkan bagian deployment produksi (compose, router, restore backup).
- [ ] **AI saran harga** — belum dikonfigurasi (butuh `AI_API_KEY`/Ollama); cek apakah mau diisi.
- [ ] Periksa `.env.example` apakah masih sesuai semua variabel yang dibaca kode.

## 6. Peta File Penting

| File | Fungsi |
|---|---|
| `docker-compose.yml` | app (3000) + db (postgres, volume pgdata) + uploads |
| `Dockerfile` | 3 stage: deps (npm ci) → builder (prisma generate + next build) → runner (standalone) |
| `docker-entrypoint.sh` | tunggu db → `prisma migrate deploy` → seed insert-only → `node server.js` |
| `next.config.ts` | `output: "standalone"` + `outputFileTracingExcludes` (**tanpa** `./prisma/**/*`) |
| `src/components/VehicleSketch.tsx` | sketsa 3D isometrik configurator |
| `src/lib/prisma.ts` | klien Prisma (jangan ubah cara importnya) |
