# Pemilihan OSIS Digital — Al Fakhir

Sistem pencoblosan ketua OSIS untuk SD & SMP Islam Modern Al Fakhir. Backend NestJS + Prisma,
frontend Next.js + Tailwind, deploy sebagai CT baru (`osis-voting`) di Proxmox, terpisah dari
CT 101 (alfakhir-lms) tapi verifikasi siswa membaca data read-only dari sana.

## ⚠️ Privasi — `reveal_mode = true`

Fitur "klik nama siswa → baru ketahuan pilihannya" secara desain **menghubungkan NIS dengan
pilihan kandidat di database**. `candidate_id` sudah tersimpan di tabel `votes` sejak siswa
submit; `revealed_at` cuma gate tampilan UI admin — bukan enkripsi atau anonimisasi. Server
(dan siapa pun dengan akses DB `osis_voting_db`) bisa tahu siapa memilih siapa, dibuka atau
tidak. Sebelum pemilihan sungguhan: komunikasikan ini ke sekolah/panitia, idealnya siswa
diberi tahu bahwa suara bisa ditelusuri secara teknis oleh admin sistem.

## 1. Setup koneksi read-only ke CT 101

Di CT 101 (alfakhirchool), buat user Postgres baru khusus untuk sistem ini — jangan reuse
kredensial existing manapun. DB nyata bernama `alfakhir_school` (bukan `alfakhir_lms`), dan
`password_hash` + jenjang (`school_level`) ada di tabel `users`, bukan `siswa` — perlu SELECT
di keduanya:

```sql
CREATE USER osis_readonly WITH PASSWORD 'ganti-dengan-password-kuat';
GRANT CONNECT ON DATABASE alfakhir_school TO osis_readonly;
GRANT USAGE ON SCHEMA public TO osis_readonly;
GRANT SELECT (id, nis, user_id) ON siswa TO osis_readonly;
GRANT SELECT (id, nama, password_hash, school_level, is_active, role) ON users TO osis_readonly;
```

Sebelum ini jalan, cek dulu firewall Proxmox: network internal (vmbr) antara CT `osis-voting`
dan CT 101 harus terbuka di port 5432. Kalau CT 101 down atau port ditutup, endpoint login
siswa akan mengembalikan pesan "Sistem verifikasi sedang gangguan, coba lagi nanti" — vote
tidak akan pernah submit dengan status auth ambigu (lihat `Ct101Service`).

Isi `CT101_DB_*` di `backend/.env` dengan kredensial user di atas.

## 2. Migration

```bash
cd backend
cp .env.example .env   # isi DATABASE_URL, CT101_DB_*, JWT secrets
npm install
npx prisma migrate deploy   # atau jalankan langsung prisma/migrations/001_init/migration.sql
```

Buat admin pertama secara manual (belum ada endpoint register — sengaja, admin dibuat panitia
via DB langsung):

```sql
INSERT INTO admin_users (username, password_hash, nama, role)
VALUES ('panitia1', '<bcrypt-hash>', 'Nama Panitia', 'Admin');
```

Hash bcrypt bisa dibuat cepat: `node -e "console.log(require('bcrypt').hashSync('password', 10))"`

## 3. Deploy

```bash
cp frontend/.env.example frontend/.env   # NEXT_PUBLIC_API_URL
export DB_PASSWORD=... NEXT_PUBLIC_API_URL=https://voting.smpialfakhir.sch.id/api
docker compose up -d --build
```

Nginx reverse-proxy `backend` (port 3000) ke `/api`, `frontend` (port 3001→3000 internal) ke `/`.
Tambahkan hostname baru `voting.smpialfakhir.sch.id` ke Cloudflare Tunnel yang sudah ada
(atau bikin tunnel terpisah kalau mau isolasi penuh dari sistem lain).

CT sizing: 1 vCPU, 1–2GB RAM — beban musiman, cukup ringan.

## Struktur

```
backend/   NestJS + Prisma — auth, election, vote, admin modules
frontend/  Next.js — /vote (siswa), /admin/* (panitia)
```
