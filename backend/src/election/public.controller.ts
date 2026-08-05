import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Tanpa guard — dipasang di layar publik/proyektor saat penghitungan suara.
// Cuma agregat suara yang sudah revealed_at (sudah dibuka admin), sama seperti /admin/hasil.
@Controller('public/election')
export class PublicController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id/results')
  async results(@Param('id') id: string) {
    const election = await this.prisma.electionPeriod.findUnique({ where: { id } });
    const candidates = await this.prisma.candidate.findMany({
      where: { electionId: id },
      orderBy: { nomorUrut: 'asc' },
    });
    const counts = await this.prisma.vote.groupBy({
      by: ['candidateId'],
      where: { electionId: id, revealedAt: { not: null } },
      _count: { candidateId: true },
    });
    const countMap = new Map(counts.map((c) => [c.candidateId, c._count.candidateId]));
    const totalCodes = await this.prisma.votingCode.count({ where: { electionId: id } });
    const totalMasuk = await this.prisma.vote.count({ where: { electionId: id } });

    return {
      title: election?.title ?? null,
      status: election?.status ?? null,
      total_siswa: totalCodes,
      total_masuk: totalMasuk,
      candidates: candidates.map((c) => ({
        candidate_id: c.id,
        nomor_urut: c.nomorUrut,
        nama_ketua: c.namaKetua,
        nama_wakil: c.namaWakil,
        foto_url: c.fotoUrl,
        jumlah_suara: countMap.get(c.id) ?? 0,
      })),
    };
  }

  // Titik kumulatif suara per kandidat berdasarkan urutan revealed_at — dipakai frontend
  // buat area chart "trend suara masuk". Bukan time-bucketed, tiap reveal = satu titik,
  // frontend yang gambar garis kumulatif per kandidat.
  @Get(':id/timeline')
  async timeline(@Param('id') id: string) {
    const votes = await this.prisma.vote.findMany({
      where: { electionId: id, revealedAt: { not: null } },
      orderBy: { revealedAt: 'asc' },
      select: { candidateId: true, revealedAt: true },
    });
    const cumulative = new Map<string, number>();
    const points = votes.map((v) => {
      const n = (cumulative.get(v.candidateId) ?? 0) + 1;
      cumulative.set(v.candidateId, n);
      return { candidate_id: v.candidateId, t: v.revealedAt, cumulative: n };
    });
    return { points };
  }

  @Get('active-id')
  async activeId() {
    const election = await this.prisma.electionPeriod.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    return { election_id: election?.id ?? null };
  }
}
