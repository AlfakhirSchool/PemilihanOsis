import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Ct101Service } from './ct101.service';
import { SiswaJwtStrategy } from './strategies/siswa.strategy';
import { AdminJwtStrategy } from './strategies/admin.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, Ct101Service, SiswaJwtStrategy, AdminJwtStrategy],
  exports: [Ct101Service],
})
export class AuthModule {}
