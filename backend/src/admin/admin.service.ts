import { Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto } from './dto/candidate.dto';
import { CreateElectionDto } from './dto/election.dto';

// Tanpa 0/O/1/I/L biar gak ambigu kalau dicetak/ditulis tangan.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

function randomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async audit(adminId: string, action: string, targetType: string, targetId?: string, detail?: string) {
    await this.prisma.auditLog.create({
      data: { adminId, action, targetType, targetId, detail },
    });
  }

  async progress(electionId: string) {
    const election = await this.prisma.electionPeriod.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundException('Pemilihan tidak ditemukan');

    const totalCodes = await this.prisma.votingCode.count({ where: { electionId } });
    const totalMasuk = await this.prisma.vote.count({ where: { electionId } });

    return {
      total_siswa: totalCodes,
      total_masuk: totalMasuk,
      partisipasi_pct: totalCodes > 0 ? Math.round((totalMasuk / totalCodes) * 1000) / 10 : 0,
    };
  }

  async pending(electionId: string) {
    const votes = await this.prisma.vote.findMany({
      where: { electionId, revealedAt: null },
      orderBy: { votedAt: 'asc' },
    });
    return votes.map((v) => ({ vote_id: v.id, code: v.code }));
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

    return {
      code: vote.code,
      candidate: {
        id: vote.candidate.id,
        nomor_urut: vote.candidate.nomorUrut,
        nama_ketua: vote.candidate.namaKetua,
      },
    };
  }

  // Kode dibuat sekali per election, dibagikan fisik ke siswa oleh panitia. Retry per-kode kalau
  // tabrakan unique (langka di ruang 32^8, tapi bukan nol) — ponytail: cukup untuk skala sekolah.
  async generateCodes(electionId: string, count: number, adminId: string) {
    const election = await this.prisma.electionPeriod.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundException('Pemilihan tidak ditemukan');

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const code = randomCode();
        try {
          await this.prisma.votingCode.create({ data: { electionId, code } });
          codes.push(code);
          break;
        } catch (err: any) {
          if (err?.code === 'P2002') continue; // tabrakan, coba lagi
          throw err;
        }
      }
    }

    await this.audit(adminId, 'generate_codes', 'voting_code', electionId, `count=${count}`);
    return { codes };
  }

  async listCodes(electionId: string) {
    const codes = await this.prisma.votingCode.findMany({
      where: { electionId },
      orderBy: { createdAt: 'asc' },
    });
    const used = codes.filter((c) => c.used).length;
    return {
      total: codes.length,
      used,
      unused: codes.length - used,
      codes: codes.map((c) => ({ code: c.code, used: c.used })),
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
