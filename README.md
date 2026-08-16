# ☀️ EcoPower ID — Platform Digitalisasi Bengkel

Website untuk bengkel konversi **campervan, motorhome, food truck**, dan instalasi **PLTS (tenaga surya)**: customer dapat mengonfigurasi kendaraan online, melihat **RAB (Rencana Anggaran Biaya) real-time**, dan meminta penawaran resmi — sementara owner mengelola harga, galeri, dan penawaran dari **panel admin**.

> Dibangun dengan Next.js 16 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · iron-session

---

## ✨ Fitur

### Untuk Customer
| Fitur | Keterangan |
|---|---|
| 🚐 **Configurator kendaraan** | Pilih tipe (Campervan/Motorhome/Food Truck/PLTS), paket, layout, material, kelengkapan, dan peralatan listrik — total & RAB terhitung **real-time** |
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
| 🖼️ **Kelola galeri** | Upload foto, judul ID/EN, kategori, unggulan, deskripsi |

---

## 🚀 Menjalankan (Docker — disarankan)

```bash
cp .env.example .env          # lalu isi ADMIN_PASSWORD & SESSION_SECRET!
docker compose up -d --build
```

Buka `http://localhost:3000`. Panel admin: `http://localhost:3000/admin`.

- Database PostgreSQL berjalan di container `db` (volume `pgdata`).
- Foto galeri tersimpan di volume `uploads` (`data/uploads`) dan dilayani lewat route dinamis `/uploads/*` (aman terhadap restart container).
- Migrasi database dijalankan otomatis saat container mulai (`prisma migrate deploy`).

### Reverse proxy (opsional, mis. nginx di server)

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 🛠️ Menjalankan untuk pengembangan

Prasyarat: Node 20+, PostgreSQL lokal (atau `docker run -d --name ecopower-pg -e POSTGRES_USER=ecopower -e POSTGRES_PASSWORD=ecopower -e POSTGRES_DB=ecopower -p 5432:5432 postgres:16-alpine`).

```bash
npm install
cp .env.example .env          # sesuaikan DATABASE_URL ke localhost
npx prisma migrate dev        # buat tabel + generate client
npx prisma db seed            # isi katalog contoh (79 komponen + galeri)
npm run dev                   # http://localhost:3000
```

Perintah lain: `npm run lint` · `npm run build` · `npm start` · `npx prisma studio` (lihat data).

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
    ├── auth.ts           # iron-session (admin)
    ├── i18n/             # Kamus ID/EN + provider
    └── site-config.ts    # Konfigurasi bisnis & kebijakan RAB
prisma/                   # Skema, migrasi, seed (katalog + galeri contoh)
```

**Cara kerja RAB**: pilihan configurator mengacu ke **kode komponen di database**. Client menghitung RAB real-time dari katalog publik, dan saat penawaran dikirim, **server menghitung ulang** dari database — jadi angka di RAB selalu berdasarkan harga yang dikelola admin.

**Mengubah harga**: Admin → Komponen & Harga, atau langsung edit `prisma/seed.ts` lalu `npx prisma db seed` (upsert idempotent).

---

## 🔒 Keamanan

- Ganti **`ADMIN_PASSWORD`** dan **`SESSION_SECRET`** sebelum produksi (sesi cookie httpOnly, 7 hari).
- Semua route `/api/admin/*` dan halaman `/admin/*` dilindungi sesi.
- `.env` tidak dikomit (lihat `.gitignore`).
- Saran AI butuh verifikasi admin sebelum diterapkan.

## 📝 Catatan

- Harga di seed adalah **estimasi pasar** — verifikasi & perbarui sesuai kondisi pasar bengkel kamu.
- Nomor referensi penawaran: `EP-<tahun>-<urutan>`.
- Bahasa default: Indonesia; toggle ID/EN di navbar (disimpan di cookie).
