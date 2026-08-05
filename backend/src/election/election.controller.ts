import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SiswaJwtGuard } from '../common/guards/siswa-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ElectionService } from './election.service';

@UseGuards(SiswaJwtGuard)
@Controller('election')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  @Get('active')
  findActive(@CurrentUser() user: { electionId: string }) {
    return this.electionService.findActive(user.electionId);
  }

  @Get(':id/status')
  status(@Param('id') id: string, @CurrentUser() user: { code: string }) {
    return this.electionService.statusFor(id, user.code);
  }
}
