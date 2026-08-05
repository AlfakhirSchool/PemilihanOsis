import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface SiswaJwtPayload {
  sub: string; // nis
  nama: string;
  jenjang: 'SD' | 'SMP';
}

@Injectable()
export class SiswaJwtStrategy extends PassportStrategy(Strategy, 'jwt-siswa') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: SiswaJwtPayload) {
    return { nis: payload.sub, nama: payload.nama, jenjang: payload.jenjang };
  }
}
