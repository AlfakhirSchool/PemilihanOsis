CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Jenjang" AS ENUM ('SD', 'SMP');
CREATE TYPE "ElectionStatus" AS ENUM ('draft', 'active', 'closed');

CREATE TABLE election_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  jenjang "Jenjang" NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status "ElectionStatus" DEFAULT 'draft',
  reveal_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES election_periods(id),
  nomor_urut INT NOT NULL,
  nama_ketua VARCHAR(100) NOT NULL,
  nama_wakil VARCHAR(100),
  foto_url TEXT,
  visi_misi TEXT,
  UNIQUE(election_id, nomor_urut)
);

-- reveal_mode = true: nis tersimpan, satu baris = satu suara siswa.
-- candidate_id sudah ada sejak vote masuk; revealed_at cuma gate tampilan admin (lihat README bagian Privasi).
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES election_periods(id),
  nis VARCHAR(20) NOT NULL,
  candidate_id UUID REFERENCES candidates(id),
  voted_at TIMESTAMP DEFAULT now(),
  revealed_at TIMESTAMP DEFAULT NULL,
  UNIQUE(election_id, nis)
);

CREATE INDEX idx_votes_election_revealed ON votes(election_id, revealed_at);

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nama VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'Panitia',
  created_at TIMESTAMP DEFAULT now()
);

-- Terpisah dari votes: audit aksi admin (buka/tutup election, reveal suara, edit kandidat).
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id TEXT,
  detail TEXT,
  created_at TIMESTAMP DEFAULT now()
);
