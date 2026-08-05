import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SiswaJwtGuard extends AuthGuard('jwt-siswa') {}
