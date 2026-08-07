import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginSiswaDto } from './dto/login-siswa.dto';
import { LoginAdminDto } from './dto/login-admin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Rate limit anti brute-force kode — dilonggarin dari 5/menit karena banyak siswa sekolah
  // bisa keluar lewat 1 IP publik yang sama (NAT), dan kode 5-karakter (~29 juta kombinasi,
  // sekali pakai) tetap susah ditebak walau limitnya lebih longgar dari ini.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('login')
  loginSiswa(@Body() dto: LoginSiswaDto) {
    return this.authService.loginSiswa(dto.code);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('admin/login')
  loginAdmin(@Body() dto: LoginAdminDto) {
    return this.authService.loginAdmin(dto.username, dto.password);
  }
}
