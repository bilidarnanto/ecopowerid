# ☀️ EcoPower ID — Platform Digitalisasi Bengkel

Website untuk bengkel konversi **campervan, motorhome, food truck**, dan instalasi **PLTS (tenaga surya)**: customer dapat mengonfigurasi kendaraan online, melihat **RAB (Rencana Anggaran Biaya) real-time** beserta **sketsa kendaraan**, dan meminta penawaran resmi — sementara owner mengelola harga, galeri, dan penawaran dari **panel admin**.

> Dibangun dengan Next.js 16 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · iron-session

---

## 🌐 Akses Produksi

| Akses | URL |
|---|---|
| **Publik (internet)** | **`https://nasbpfsby.duckdns.org:8444`** |
| Panel admin | `https://nasbpfsby.duckdns.org:8444/admin` |
| Lokal (LAN) | `http://192.168.100.234:3000` (langsung ke container) |

Akses publik lewat **reverse proxy nginx bersama** (`nextcloud_nginx`, SSL Let's Encrypt) — pola yang sama dipakai proyek lain di server (Nextcloud `:443`, BBM `:5000`, Karaoke `:8443`).

---

## ✨ Fitur

### Untuk Customer
| Fitur | Keterangan |
|---|---|
| 🚐 **Configurator kendaraan** | Pilih tipe (Campervan/Motorhome/Food Truck/PLTS), paket, layout, material, kelengkapan, dan peralatan listrik — total & RAB terhitung **real-time** |
| 🎨 **Sketsa 3D isometrik** | Pratinjau kendaraan (SVG isometrik, tanpa dependency) yang berubah mengikuti pilihan tipe/paket/layout/material/add-on |
| ☀️ **Kalkulator PLTS** | Input kebutuhan listrik harian (peralatan atau manual) → rekomendasi teknis: panel, baterai, inverter, SCC + RAB |
| 📄 **RAB otomatis + PDF** | Rincian biaya per kelompok (struktur, interior, peralatan, PLTS, jasa) + margin & PPN, bisa **diunduh PDF** |
| 📨 **Permintaan penawaran** | Simpan konfigurasi + data diri → nomor referensi (`EP-2026-0001`) → masuk ke panel admin |
| 🌍 **Bilingual** | Bahasa Indonesia & English (tombol di navbar) |
| 🖼️ **Galeri portofolio** | Foto proyek dengan filter kategori |

### Untuk Owner (Admin)
| Fitur | Keterangan |
|---|---|
| 🧩 **Kelola komponen & harga** | CRUD lengkap: kode, nama ID/EN, kategori, satuan, harga, spesifikasi (JSON), aktif/nonaktif |
| 🤖 **Saran harga AI** | AI memeriksa harga pasar terkini → **saran PENDING** → admin verifikasi lalu **Terapkan/Tolak** (tidak pernah otomatis!) |
| 📨 **Kelola penawaran** | Daftar penawaran + filter status, detail RAB, ubah status (BARU → DITINJAU → DISETUJUI/DITOLAK) |
| 🖼️ **Kelola galeri** | Upload foto (JPG/PNG/GIF/WebP/AVIF, divalidasi isi file), judul ID/EN, kategori, unggulan, deskripsi |

---

## 🚀 Menjalankan dengan Docker (cara produksi)

```bash
cp .env.example .env          # lalu isi ADMIN_PASSWORD & SESSION_SECRET!
docker compose up -d --build
```

- Buka `http://localhost:3000` (lokal) atau `https://nasbpfsby.duckdns.org:8444` (publik).
- Panel admin: `http://localhost:3000/admin` atau `...:8444/admin`.
- Database PostgreSQL berjalan di container `db` (volume `pgdata`).
- Foto galeri tersimpan di volume `uploads` (`data/uploads`) dan dilayani lewat route dinamis `/uploads/*` (aman terhadap restart container).
- Migrasi database dijalankan otomatis saat container mulai (`prisma migrate deploy`); seed berjalan **insert-only** (tidak menimpa data yang diedit admin).

### Perintah yang sering dipakai

```bash
docker compose up -d --build          # rebuild + deploy (±3 menit, npm ci di-cache)
docker compose logs app -f            # ikuti log aplikasi
docker compose ps                     # status container
docker compose exec app sh            # masuk ke container
```

### Verifikasi cepat

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/catalog   # → 200
curl -s http://localhost:3000/konfigurator | grep -o "Pratinjau 3D" | head -1
```

---

## 🛠️ Menjalankan untuk pengembangan (tanpa Docker)

Prasyarat: Node 20+, PostgreSQL lokal (atau `docker run -d --name ecopower-pg -e POSTGRES_USER=ecopower -e POSTGRES_PASSWORD=ecopower -e POSTGRES_DB=ecopower -p 5432:5432 postgres:16-alpine`).

```bash
npm install
cp .env.example .env          # sesuaikan DATABASE_URL ke localhost
npx prisma migrate dev        # buat tabel + generate client
npx prisma db seed            # isi katalog contoh (79 komponen + galeri)
npm run dev                   # http://localhost:3000
```

Perintah lain: `npm run lint` · `npm run build` · `npm start` · `npx prisma studio` (lihat data).

> ⚠️ **Jangan** jalankan `npm run build` di host saat container Docker aktif — keduanya memakai folder `.next` yang sama dan bisa saling merusak state.

---

## 🧱 Arsitektur & Deployment

### Topologi server

```
Internet ──▶ Router MikroTik RB1100 (182.253.62.194)
              └─ dst-nat :8444 → 192.168.100.234
                    └─ nextcloud_nginx (SSL Let's Encrypt)
                          └─ ecopowerid-app-1:3000 (Next.js standalone)
                                └─ ecopowerid-db-1 (PostgreSQL 16)
```

- App container join ke **dua network Docker**: `ecopowerid_default` (ke DB) dan `nextcloud_net` (eksternal, ke reverse proxy).
- Config reverse proxy: `/home/it-ef/hybrid_nextcloud/nginx/conf.d/ecopower.conf` — `listen 8444 ssl`, blokir akses via IP langsung (`return 444` bila Host ≠ domain).
- Router: port 8444 sudah termasuk rule dst-nat `FW-All-Ports` (port 80/443/5000/8080/8443/8444/9980/8081).

### Reverse proxy untuk server lain (opsional)

```nginx
server {
    listen 443 ssl;
    server_name ecopower.example.com;
    # ... SSL cert ...

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> ⚠️ Header **`X-Real-IP`** wajib di-set proxy: rate limiter login admin memakainya untuk mengidentifikasi klien. Tanpa itu, semua permintaan dianggap satu IP.

---

## 🔒 Keamanan

- **Login admin di-rate-limit**: maks 5× percobaan gagal per 15 menit per IP → lockout 15 menit (HTTP 429 + `Retry-After`). Password dibandingkan **timing-safe**; ada delay 400ms saat gagal (anti brute-force).
- **Upload galeri divalidasi isi file** (magic bytes JPG/PNG/GIF/WebP/AVIF), bukan hanya klaim MIME dari klien. **SVG dilarang** (risiko stored XSS). Batas ukuran 8MB.
- Route `/uploads/*` mengirim `X-Content-Type-Options: nosniff`; SVG seed dilayani dengan CSP `sandbox`.
- Semua route `/api/admin/*` dan halaman `/admin/*` dilindungi sesi (cookie httpOnly, 7 hari).
- Ganti **`ADMIN_PASSWORD`** dan **`SESSION_SECRET`** sebelum produksi (wajib!).
- `.env` tidak dikomit (lihat `.gitignore`); yang masuk repo hanya `.env.example` (template aman).
- Saran AI butuh verifikasi admin sebelum diterapkan.

---

## 🤖 Fitur AI Saran Harga

Panel admin → **Saran Harga AI**:

1. Klik **"Periksa Harga Pasar"** — sistem mengirim daftar komponen aktif ke model AI.
2. AI membalas estimasi harga pasar (rentang + alasan) → tersimpan sebagai saran **PENDING**.
3. Admin meninjau: **Terapkan** (harga komponen diperbarui + riwayat tercatat) atau **Tolak**.

Saran **tidak pernah** diterapkan otomatis — admin selalu memverifikasi.

### Menyambungkan AI

Adapter menggunakan endpoint **OpenAI-compatible** di `.env`:

```env
AI_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o-mini"
```

Atau **Ollama lokal** (privasi, gratis — sesuai resource server):

```env
AI_BASE_URL="http://host.docker.internal:11434/v1"
AI_API_KEY="ollama"
AI_MODEL="llama3.1"
```

Tanpa `AI_API_KEY`, tombol AI menampilkan pesan bahwa fitur belum dikonfigurasi.

---

## 🗂️ Struktur Proyek

```
src/
├── app/                  # Halaman & API routes (App Router)
│   ├── (halaman publik): /, /konfigurator, /plts, /galeri, /kontak, /penawaran/[id]
│   ├── admin/            # Panel admin (login, dashboard, komponen, harga, penawaran, galeri)
│   └── api/              # Route handlers (catalog, quotes, auth, admin/*)
├── components/           # Komponen bersama (Navbar, RabTable, PltsSummary, PDF, dll)
└── lib/
    ├── plts.ts           # Mesin kalkulasi PLTS (ukuran panel/baterai/inverter/SCC)
    ├── rab.ts            # Builder RAB (grup, margin, PPN) — dipakai client & server
    ├── ai.ts             # Adapter AI saran harga
    ├── auth.ts           # iron-session (admin) + password check timing-safe
    ├── rate-limit.ts     # Rate limiter in-memory login admin (5×/15 mnt + lockout)
    ├── prisma.ts         # Klien Prisma (jangan ubah cara importnya)
    ├── i18n/             # Kamus ID/EN + provider
    └── site-config.ts    # Konfigurasi bisnis & kebijakan RAB
prisma/                   # Skema, migrasi, seed (katalog + galeri contoh)
```

**Cara kerja RAB**: pilihan configurator mengacu ke **kode komponen di database**. Client menghitung RAB real-time dari katalog publik, dan saat penawaran dikirim, **server menghitung ulang** dari database — jadi angka di RAB selalu berdasarkan harga yang dikelola admin.

**Mengubah harga**: Admin → Komponen & Harga, atau langsung edit `prisma/seed.ts` lalu `npx prisma db seed` (upsert idempotent).

---

## 🧰 File Penting

| File | Fungsi |
|---|---|
| `docker-compose.yml` | app (3000) + db (postgres, volume pgdata) + uploads; app join `nextcloud_net` |
| `Dockerfile` | 3 stage: deps (npm ci) → builder (prisma generate + next build) → runner (standalone) |
| `docker-entrypoint.sh` | tunggu db → `prisma migrate deploy` → seed insert-only → `node server.js` |
| `next.config.ts` | `output: "standalone"` + `outputFileTracingExcludes` (**tanpa** `./prisma/**/*`!) |
| `src/components/VehicleSketch.tsx` | sketsa 3D isometrik configurator |
| `src/lib/rate-limit.ts` | rate limiter login admin |

> ⚠️ **Jangan** tambahkan `"./prisma/**/*"` ke `outputFileTracingExcludes` di `next.config.ts` — itu membuat klien Prisma hilang dari build standalone dan semua route API error 500 (lihat catatan riwayat).

---

## 📝 Catatan

- Harga di seed adalah **estimasi pasar** — verifikasi & perbarui sesuai kondisi pasar bengkel kamu.
- Nomor referensi penawaran: `EP-<tahun>-<urutan>`.
- Bahasa default: Indonesia; toggle ID/EN di navbar (disimpan di cookie).
- Catatan operasional & riwayat sesi: lihat **`HANDOVER.md`**.
