import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface AdminJwtPayload {
  sub: string; // admin user id
  username: string;
  role: string;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ADMIN_SECRET as string,
    });
  }

  // Role diverifikasi ulang dari DB tiap request — token tak bisa dipakai eskalasi privilege.
  async validate(payload: AdminJwtPayload) {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) return null;
    return { id: admin.id, username: admin.username, nama: admin.nama, role: admin.role };
  }
}
