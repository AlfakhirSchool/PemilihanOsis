import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ct101Service } from '../auth/ct101.service';
import { CreateCandidateDto } from './dto/candidate.dto';
import { CreateElectionDto } from './dto/election.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ct101: Ct101Service,
  ) {}

  private async audit(adminId: string, action: string, targetType: string, targetId?: string, detail?: string) {
    await this.prisma.auditLog.create({
      data: { adminId, action, targetType, targetId, detail },
    });
  }

  async progress(electionId: string) {
    const election = await this.prisma.electionPeriod.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundException('Pemilihan tidak ditemukan');

    const totalSiswa = await this.ct101.countSiswaByJenjang(election.jenjang);
    const totalMasuk = await this.prisma.vote.count({ where: { electionId } });

    return {
      total_siswa: totalSiswa,
      total_masuk: totalMasuk,
      partisipasi_pct: totalSiswa > 0 ? Math.round((totalMasuk / totalSiswa) * 1000) / 10 : 0,
    };
  }

  async pending(electionId: string) {
    const votes = await this.prisma.vote.findMany({
      where: { electionId, revealedAt: null },
      orderBy: { votedAt: 'asc' },
    });
    // nama siswa perlu di-lookup ke CT101 satu-satu karena tabel votes cuma simpan nis
    const withNama = await Promise.all(
      votes.map(async (v) => ({
        vote_id: v.id,
        nis: v.nis,
        nama: (await this.ct101.findSiswaByNis(v.nis))?.nama ?? v.nis,
      })),
    );
    return withNama;
  }

  async reveal(electionId: string, voteId: string, adminId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { id: voteId },
      include: { candidate: true },
    });
    if (!vote || vote.electionId !== electionId) throw new NotFoundException('Suara tidak ditemukan');
    if (!vote.revealedAt) {
      await this.prisma.vote.update({ where: { id: voteId }, data: { revealedAt: new Date() } });
      await this.audit(adminId, 'reveal_vote', 'vote', voteId);
    }

    const siswa = await this.ct101.findSiswaByNis(vote.nis);
    return {
      nama: siswa?.nama ?? vote.nis,
      candidate: {
        id: vote.candidate.id,
        nomor_urut: vote.candidate.nomorUrut,
        nama_ketua: vote.candidate.namaKetua,
      },
    };
  }

  async results(electionId: string) {
    const candidates = await this.prisma.candidate.findMany({
      where: { electionId },
      orderBy: { nomorUrut: 'asc' },
    });
    const counts = await this.prisma.vote.groupBy({
      by: ['candidateId'],
      where: { electionId, revealedAt: { not: null } },
      _count: { candidateId: true },
    });
    const countMap = new Map(counts.map((c) => [c.candidateId, c._count.candidateId]));

    return candidates.map((c) => ({
      candidate_id: c.id,
      nomor_urut: c.nomorUrut,
      nama_ketua: c.namaKetua,
      nama_wakil: c.namaWakil,
      jumlah_suara: countMap.get(c.id) ?? 0,
    }));
  }

  createCandidate(dto: CreateCandidateDto) {
    return this.prisma.candidate.create({
      data: {
        electionId: dto.election_id,
        nomorUrut: dto.nomor_urut,
        namaKetua: dto.nama_ketua,
        namaWakil: dto.nama_wakil,
        fotoUrl: dto.foto_url,
        visiMisi: dto.visi_misi,
      },
    });
  }

  listCandidates(electionId: string) {
    return this.prisma.candidate.findMany({ where: { electionId }, orderBy: { nomorUrut: 'asc' } });
  }

  deleteCandidate(id: string) {
    return this.prisma.candidate.delete({ where: { id } });
  }

  async createElection(dto: CreateElectionDto, adminId: string) {
    const election = await this.prisma.electionPeriod.create({
      data: {
        title: dto.title,
        jenjang: dto.jenjang,
        startTime: new Date(dto.start_time),
        endTime: new Date(dto.end_time),
      },
    });
    await this.audit(adminId, 'create_election', 'election_period', election.id);
    return election;
  }

  listElections() {
    return this.prisma.electionPeriod.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async setElectionStatus(id: string, status: 'draft' | 'active' | 'closed', adminId: string) {
    const election = await this.prisma.electionPeriod.update({ where: { id }, data: { status } });
    await this.audit(adminId, `set_status_${status}`, 'election_period', id);
    return election;
  }
}
