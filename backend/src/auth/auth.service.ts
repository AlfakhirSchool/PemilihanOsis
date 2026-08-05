import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Ct101Service } from './ct101.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly ct101: Ct101Service,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async loginSiswa(nis: string, password: string) {
    const siswa = await this.ct101.findSiswaByNis(nis);
    if (!siswa) throw new UnauthorizedException('NIS atau password salah');

    const valid = await bcrypt.compare(password, siswa.password_hash);
    if (!valid) throw new UnauthorizedException('NIS atau password salah');

    const accessToken = this.jwt.sign(
      { sub: siswa.nis, nama: siswa.nama, jenjang: siswa.jenjang },
      { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN || '12h' },
    );

    return { accessToken, siswa: { nis: siswa.nis, nama: siswa.nama, jenjang: siswa.jenjang } };
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
