import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ElectionService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(jenjang: 'SD' | 'SMP') {
    const election = await this.prisma.electionPeriod.findFirst({
      where: { status: 'active', jenjang },
      include: { candidates: { orderBy: { nomorUrut: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!election) throw new NotFoundException('Tidak ada pemilihan aktif untuk jenjang ini');
    return election;
  }

  async statusFor(electionId: string, nis: string) {
    const election = await this.prisma.electionPeriod.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundException('Pemilihan tidak ditemukan');

    const vote = await this.prisma.vote.findUnique({
      where: { electionId_nis: { electionId, nis } },
    });
    return { sudah_vote: !!vote };
  }
}
