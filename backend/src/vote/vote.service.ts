import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VoteService {
  constructor(private readonly prisma: PrismaService) {}

  async cast(electionId: string, candidateId: string, code: string) {
    const election = await this.prisma.electionPeriod.findUnique({ where: { id: electionId } });
    if (!election) throw new NotFoundException('Pemilihan tidak ditemukan');

    const now = new Date();
    if (election.status !== 'active' || now < election.startTime || now > election.endTime) {
      throw new BadRequestException('Pemilihan sedang tidak berlangsung');
    }

    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate || candidate.electionId !== electionId) {
      throw new BadRequestException('Kandidat tidak valid');
    }

    try {
      await this.prisma.$transaction([
        this.prisma.vote.create({ data: { electionId, code, candidateId } }),
        this.prisma.votingCode.updateMany({
          where: { electionId, code },
          data: { used: true, usedAt: now },
        }),
      ]);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Anda sudah memilih, tidak bisa vote ulang');
      }
      throw err;
    }

    return { success: true };
  }
}
