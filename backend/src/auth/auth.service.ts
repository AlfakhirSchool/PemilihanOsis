import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // Kode anonim: tidak ada nama/NIS di sisi manapun. Kode dibuat admin dan cuma valid untuk
  // satu election yang sedang aktif dalam rentang waktunya — lihat AdminService.generateCodes.
  async loginSiswa(code: string) {
    const votingCode = await this.prisma.votingCode.findFirst({
      where: { code },
      include: { election: true },
    });
    if (!votingCode) throw new UnauthorizedException('Kode tidak valid');
    if (votingCode.used) throw new UnauthorizedException('KODE SUDAH TERPAKAI');

    const election = votingCode.election;
    const now = new Date();
    if (election.status !== 'active' || now < election.startTime || now > election.endTime) {
      throw new BadRequestException('Pemilihan sedang tidak berlangsung');
    }

    const accessToken = this.jwt.sign(
      { sub: votingCode.code, electionId: election.id },
      { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN || '2h' },
    );

    return { accessToken };
  }

  async loginAdmin(username: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { username } });
    if (!admin) throw new UnauthorizedException('Username atau password salah');

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Username atau password salah');

    const accessToken = this.jwt.sign(
      { sub: admin.id, username: admin.username, role: admin.role },
      { secret: process.env.JWT_ADMIN_SECRET, expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '8h' },
    );

    return { accessToken, admin: { id: admin.id, nama: admin.nama, role: admin.role } };
  }
}
