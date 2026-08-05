import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ElectionService {
  constructor(private readonly prisma: PrismaService) {}

  // Kode login sudah scoped ke satu election_id (lihat AuthService.loginSiswa) — jenjang tidak
  // perlu dicek terpisah lagi, election yang dipilih kode itulah satu-satunya yang relevan.
  async findActive(electionId: string) {
    const election = await this.prisma.electionPeriod.findFirst({
      where: { id: electionId, status: 'active' },
      include: { candidates: { orderBy: { nomorUrut: 'asc' } } },
    });
    if (!election) throw new NotFoundException('Pemilihan tidak aktif');
    return election;
  }

  async statusFor(electionId: string, code: string) {
    const election = await this.prisma.electionPeriod.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundException('Pemilihan tidak ditemukan');

    const vote = await this.prisma.vote.findUnique({
      where: { electionId_code: { electionId, code } },
    });
    return { sudah_vote: !!vote };
  }
}
