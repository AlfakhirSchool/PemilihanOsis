# OSALFA — Pemilihan OSIS Digital Al Fakhir

Sistem pencoblosan ketua OSIS untuk SD & SMP Islam Modern Al Fakhir. Backend NestJS + Prisma,
frontend Next.js + Tailwind, deploy sebagai CT `osis-voting` di Proxmox. Berdiri sendiri —
tidak ada koneksi ke sistem sekolah lain (CT101/alfakhirchool). Login siswa pakai **kode
pemilih acak**, bukan NIS/akun sekolah.

## Alur kode pemilih

1. Panitia generate N kode acak per periode pemilihan (`/admin/kode`) — 8 karakter, alfanumerik,
   dibuat dengan CSPRNG (`crypto.randomInt`), tanpa karakter ambigu (0/O/1/I/L).
2. Kode di-export CSV, dicetak/dibagikan fisik ke siswa (misal 1 kertas kode per siswa saat masuk TPS).
3. Siswa buka `/vote`, masukkan kode, pilih paslon, submit. Kode langsung terpakai (sekali pakai).
4. Panitia buka `/admin/hitung-suara`: klik satu kode di daftar "belum dibuka" → pilihan
   kandidatnya kebuka, grafik hasil naik.

**Kode ini murni acak, tidak terhubung ke nama/NIS/kelas siswa manapun di database.** Sistem
tidak tahu siapa pemilik kode tertentu — hanya tahu kode itu valid dan belum dipakai.

## ⚠️ Privasi — `reveal_mode = true`

Walaupun kode anonim, desain `reveal_mode = true` tetap berarti **`candidate_id` sudah
tersimpan di tabel `votes` sejak siswa submit** — `revealed_at` cuma gate tampilan UI admin,
bukan enkripsi. Karena kode tidak terhubung ke identitas, membuka satu baris `votes` tidak
membocorkan siapa memilih apa — tapi kalau ke depan ada yang berencana mencatat kode-ke-siswa
di luar sistem ini (misal daftar presensi manual "siswa X dapat kode Y"), privasi itu hilang di
titik pencatatan itu, bukan di database ini. Komunikasikan itu ke panitia kalau distribusi kode
melibatkan pencatatan semacam itu.

## 1. Setup

```bash
cd backend
cp .env.example .env   # isi DATABASE_URL, JWT secrets
npm install
npx prisma migrate deploy
```

Buat admin pertama secara manual (belum ada endpoint register — sengaja, admin dibuat panitia
via DB langsung):

```sql
INSERT INTO admin_users (username, password_hash, nama, role)
VALUES ('panitia1', '<bcrypt-hash>', 'Nama Panitia', 'Admin');
```

Hash bcrypt bisa dibuat cepat: `node -e "console.log(require('bcrypt').hashSync('password', 10))"`

## 2. Deploy

```bash
cp frontend/.env.example frontend/.env   # NEXT_PUBLIC_API_URL
export DB_PASSWORD=... NEXT_PUBLIC_API_URL=https://voting.smpialfakhir.sch.id
docker compose up -d --build
```

Backend (port 3000) dan frontend (port 3001→3000 internal) diekspos lewat dua hostname
Cloudflare Tunnel terpisah (path `/admin` dipakai baik oleh route backend maupun halaman
frontend, jadi tidak bisa disatukan lewat satu hostname + path split) — lihat
`frontend/.env.example` untuk detail `NEXT_PUBLIC_API_URL`.

CT sizing: 1 vCPU, 1–2GB RAM — beban musiman, cukup ringan.

## Struktur

```
backend/   NestJS + Prisma — auth (kode), election, vote, admin modules (termasuk generate kode)
frontend/  Next.js — /vote (siswa), /admin/* (panitia, termasuk /admin/kode)
```
