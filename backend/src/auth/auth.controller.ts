import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginSiswaDto } from './dto/login-siswa.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { Ct101Service } from './ct101.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly ct101: Ct101Service,
  ) {}

  // Rate limit anti brute-force NIS/password.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  loginSiswa(@Body() dto: LoginSiswaDto) {
    return this.authService.loginSiswa(dto.nis, dto.password);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('admin/login')
  loginAdmin(@Body() dto: LoginAdminDto) {
    return this.authService.loginAdmin(dto.username, dto.password);
  }

  @Post('health/ct101')
  async ct101Health() {
    const ok = await this.ct101.healthCheck();
    return { ok };
  }
}
