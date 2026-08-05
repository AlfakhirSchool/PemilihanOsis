import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Pool } from 'pg';

export interface SiswaRecord {
  nis: string;
  nama: string;
  kelas: string;
  jenjang: 'SD' | 'SMP';
  password_hash: string;
}

// Client read-only terpisah ke Postgres CT 101 (alfakhir-lms) — DB & host beda dari osis_voting_db,
// jadi bukan lewat Prisma. Pool kecil karena beban musiman saja (lihat README bagian CT 101).
@Injectable()
export class Ct101Service {
  private readonly logger = new Logger(Ct101Service.name);
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.CT101_DB_HOST,
      port: Number(process.env.CT101_DB_PORT || 5432),
      user: process.env.CT101_DB_USER,
      password: process.env.CT101_DB_PASSWORD,
      database: process.env.CT101_DB_DATABASE,
      max: 5,
      connectionTimeoutMillis: 3000,
    });
  }

  async findSiswaByNis(nis: string): Promise<SiswaRecord | null> {
    try {
      const result = await this.pool.query<SiswaRecord>(
        'SELECT nis, nama, kelas, jenjang, password_hash FROM siswa WHERE nis = $1',
        [nis],
      );
      return result.rows[0] ?? null;
    } catch (err) {
      this.logger.error(`CT101 query gagal: ${(err as Error).message}`);
      throw new ServiceUnavailableException(
        'Sistem verifikasi sedang gangguan, coba lagi nanti',
      );
    }
  }

  async countSiswaByJenjang(jenjang: 'SD' | 'SMP'): Promise<number> {
    try {
      const result = await this.pool.query<{ count: string }>(
        'SELECT COUNT(*) FROM siswa WHERE jenjang = $1',
        [jenjang],
      );
      return Number(result.rows[0]?.count ?? 0);
    } catch (err) {
      this.logger.error(`CT101 query gagal: ${(err as Error).message}`);
      throw new ServiceUnavailableException(
        'Sistem verifikasi sedang gangguan, coba lagi nanti',
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
