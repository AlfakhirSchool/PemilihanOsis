import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface SiswaJwtPayload {
  sub: string; // code
  electionId: string;
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
    return { code: payload.sub, electionId: payload.electionId };
  }
}
