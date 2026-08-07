import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SiswaJwtGuard } from '../common/guards/siswa-jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VoteService } from './vote.service';
import { CastVoteDto } from './dto/cast-vote.dto';

@UseGuards(SiswaJwtGuard)
@Controller('election')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @Post(':id/vote')
  cast(@Param('id') id: string, @Body() dto: CastVoteDto, @CurrentUser() user: { code: string }) {
    return this.voteService.cast(id, dto.candidate_id, user.code);
  }
}
