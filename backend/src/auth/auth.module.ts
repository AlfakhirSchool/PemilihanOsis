import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SiswaJwtStrategy } from './strategies/siswa.strategy';
import { AdminJwtStrategy } from './strategies/admin.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, SiswaJwtStrategy, AdminJwtStrategy],
})
export class AuthModule {}
