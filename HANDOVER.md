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
- Firewall input WAN = drop; forward rule accept ke host ini — sudah aman.

### 1.4 Akses via Domain + Reverse Proxy Bersama ✅ (sesi ini)
Semua proyek memakai domain **`nasbpfsby.duckdns.org`** dengan port berbeda, di-proxy oleh
container nginx bersama `nextcloud_nginx` (network `nextcloud_net`):

| Proyek | URL | Nginx → upstream |
|---|---|---|
| Nextcloud | `https://nasbpfsby.duckdns.org` | `nextcloud:80` |
| BBM | `https://nasbpfsby.duckdns.org:5000` | `bbm_web:5000` |
| Karaoke | `https://nasbpfsby.duckdns.org:8443` | `karaoke_frontend:80` |
| **EcoPower** | **`https://nasbpfsby.duckdns.org:8444`** | **`ecopowerid-app-1:3000`** |

Yang dikerjakan:
- `docker-compose.yml` EcoPower: service `app` join ke network eksternal **`nextcloud_net`**
  (selain `default`); `nextcloud_net` dideklarasikan `external: true`.
- **`/home/it-ef/hybrid_nextcloud/nginx/conf.d/ecopower.conf`** (baru): `listen 8444 ssl`
  → proxy ke `ecopowerid-app-1:3000`; ada `if ($host !~ nasbpfsby\.duckdns\.org) { return 444; }`
  untuk memblokir akses via IP langsung (anti-scan bot). SSL pakai cert Let's Encrypt bersama.
- `/home/it-ef/hybrid_nextcloud/docker-compose.yaml`: nginx publish `"8444:8444"`
  (backup: `docker-compose.yaml.bak-ecopower`). Container `nextcloud_nginx` di-recreate.
- Router: port **8444** sudah ada di rule `FW-All-Ports` (dst-nat WAN → `192.168.100.234`),
  tidak perlu rule baru. **Rule sementara `FW-EcoPower-Port-3000` sudah DIHAPUS** —
  publik tidak bisa lagi akses `:3000` langsung.
- Verifikasi: port-check eksternal `182.253.62.194:8444` **open**, `:3000` **closed**.
  `https://nasbpfsby.duckdns.org:8444/{/konfigurator,/api/catalog,/admin→login}` semua OK.
  LAN resolve domain → `192.168.100.234` via DNS static router (`NAS-Local-DNS`), jadi klien
  LAN juga dapat akses (hairpin ke IP publik memang tidak aktif, sama seperti proyek lain).

### 1.5 Pembersihan & Dockerisasi Penuh ✅
Proyek kini **100% berjalan via Docker**; tidak ada proses Node di host:
- Dimatikan proses liar: `next-server` standalone lama (port 3100, dir `.next/standalone (deleted)`).
- Dihapus container sampah: `ecopower-orig3` (container tes) & `ecopower-pg`
  (postgres standalone — data sudah terverifikasi ada di compose `db`, 79 komponen).
- Dihapus image lama/rusak (`ecopower-app`, image pra-fix, build rusak).
- Container proyek lain (karaoke, bbm, nextcloud) **tidak disentuh**.

### 1.6 Perbaikan Kritis: Trace Prisma Hilang di Build Standalone ✅
- **Gejala:** semua route API (catalog, admin) 500 di container:
  `Failed to load external module @prisma/client-2c3a283f134fdcb6: Cannot find module ...`
- **Akar masalah:** `outputFileTracingExcludes` di `next.config.ts` berisi `"./prisma/**/*"`.
  Pola itu ikut membuang hasil trace klien Prisma (`node_modules/.prisma`, `node_modules/@prisma/*`)
  dari output standalone → `.next/node_modules/@prisma/client-<hash>` tidak pernah dibuat.
- **Perbaikan:** hapus `"./prisma/**/*"` dari excludes (commit `ac5e7b9`). `./src/**/*` dan
  `./data/**/*` tetap dikecualikan. Komentar peringatan sudah ditulis di `next.config.ts`.
- **⚠️ JANGAN** menambahkan `"./prisma/**/*"` ke `outputFileTracingExcludes` lagi.

### 1.7 Hardening Keamanan: Rate-Limit Login & Validasi Upload Galeri ✅
- **`src/lib/rate-limit.ts`** (baru) — rate limiter in-memory untuk login admin:
  maks 5x gagal per 15 menit per IP, lalu lockout 15 menit (HTTP 429 + `Retry-After`,
  `X-RateLimit-Limit/Remaining`). IP diambil dari header `X-Real-IP` yang di-set nginx
  (tidak bisa di-spoof klien). Sweeper otomatis tiap 5 menit membuang entri basi.
  ⚠️ In-memory → hanya cocok deployment single-container (seperti sekarang); kalau
  nanti multi-instance, ganti dengan store bersama (Redis/Upstash).
- **`src/lib/auth.ts`** — `checkAdminPassword` kini timing-safe
  (`crypto.timingSafeEqual` atas hash SHA-256) → anti side-channel timing attack.
- **`src/app/api/auth/login/route.ts`** — pakai rate limiter + delay 400ms saat
  password salah (memperlambat brute-force, tetap <1 dtk untuk user).
- **`src/app/api/admin/gallery/route.ts`** — validasi isi file via **magic bytes**
  (JPG/PNG/GIF/WebP/AVIF), bukan klaim `file.type` dari klien yang bisa dipalsukan.
  Ekstensi ditentukan dari isi file. **SVG TIDAK lagi bisa di-upload** (risiko stored
  XSS — SVG bisa memuat `<script>`). Batas 8MB tetap.
- **`src/app/uploads/[...path]/route.ts`** — tambah header `X-Content-Type-Options:
  nosniff`; untuk SVG (hanya file seed dari repo) tambah `Content-Security-Policy:
  sandbox`.
- Verifikasi end-to-end (di container berjalan): 5x password salah → 401, ke-6 → 429
  (password benar pun ditolak saat lockout); upload HTML palsu ber-MIME `image/jpeg`
  → 400; upload SVG → 400; PNG asli → 200. Header `nosniff` terverifikasi pada respon.

---

## 2. Kondisi Sekarang (running state)

| Item | Status |
|---|---|
| Container aktif | `ecopowerid-app-1` (port 3000, join `nextcloud_net`) + `ecopowerid-db-1` (postgres:16-alpine, healthy) |
| Image app | `ecopowerid-app:latest` (standalone, ±1.13 GB) — build dengan fix trace Prisma |
| Volume | `pgdata` (DB) + `uploads` (foto galeri → `data/uploads`) |
| `GET /api/catalog` | 200 (79 komponen) |
| `/konfigurator` | 200, memuat "Pratinjau 3D" |
| `/admin` | 307 → `/admin/login` (terproteksi sesi) |
| Akses publik | **`https://nasbpfsby.duckdns.org:8444`** (via nextcloud_nginx); `:3000` publik sudah ditutup |
| `.env` | `ADMIN_PASSWORD` & `SESSION_SECRET` terisi (kuat); `DATABASE_URL` di-override compose ke `db:5432` |
| Git | ter-push ke `bestprofitsurabaya/ecopowerid` (branch `main`); working tree bersih |

## 3. Perintah yang Sering Dipakai

```bash
# Rebuild & deploy (npm ci di-cache, ±3 menit)
docker compose up -d --build
# Catatan: setelah recreate app container, cek lagi join network-nya:
docker inspect ecopowerid-app-1 --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
#   → harus muncul: ecopowerid_default nextcloud_net

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
6. Akses publik lewat **`nextcloud_nginx`** (proyek hybrid_nextcloud). Jika container
   `nextcloud_nginx` di-recreate/di-rebuild, pastikan conf.d masih memuat `ecopower.conf`
   dan compose masih publish `8444:8444`. Config nginx di-mount `:ro` dari host, jadi
   edit file conf.d langsung + `docker compose up -d --no-deps nginx` di
   `/home/it-ef/hybrid_nextcloud` (jangan recreate proyek lain tanpa perlu).

## 5. Langkah Berikutnya yang Disarankan (belum dikerjakan)

- [x] **Domain + HTTPS** — ✅ akses publik sekarang `https://nasbpfsby.duckdns.org:8444`
      (SSL Let's Encrypt via nextcloud_nginx). Tersisa opsional: domain khusus EcoPower
      (mis. `ecopower.duckdns.org`) bila mau tanpa port.
- [x] **Hardening keamanan** — ✅ rate-limit login (5x/15 mnt + lockout), validasi magic-bytes
      upload galeri + larang SVG, `nosniff` di route uploads. Tersisa opsional: CSP/HSTS level
      situs, proteksi `docker-entrypoint.sh` seed agar tidak jalan tiap start.
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
| `src/lib/rate-limit.ts` | rate limiter in-memory login admin (5x/15 mnt + lockout) |
| `src/app/api/auth/login/route.ts` | login admin — rate-limit + delay anti brute-force |
| `src/app/api/admin/gallery/route.ts` | upload galeri — validasi magic-bytes, SVG dilarang |
