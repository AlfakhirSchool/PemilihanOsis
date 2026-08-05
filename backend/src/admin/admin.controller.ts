import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateCandidateDto } from './dto/candidate.dto';
import { CreateElectionDto, RevealVoteDto, UpdateElectionStatusDto } from './dto/election.dto';

@UseGuards(AdminJwtGuard, RolesGuard)
@Roles('Admin', 'Panitia')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('election/:id/progress')
  progress(@Param('id') id: string) {
    return this.adminService.progress(id);
  }

  @Get('election/:id/pending')
  pending(@Param('id') id: string) {
    return this.adminService.pending(id);
  }

  @Post('election/:id/reveal')
  reveal(
    @Param('id') id: string,
    @Body() dto: RevealVoteDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.adminService.reveal(id, dto.vote_id, user.id);
  }

  @Get('election/:id/results')
  results(@Param('id') id: string) {
    return this.adminService.results(id);
  }

  @Post('candidates')
  createCandidate(@Body() dto: CreateCandidateDto) {
    return this.adminService.createCandidate(dto);
  }

  @Get('candidates/:electionId')
  listCandidates(@Param('electionId') electionId: string) {
    return this.adminService.listCandidates(electionId);
  }

  @Delete('candidates/:id')
  deleteCandidate(@Param('id') id: string) {
    return this.adminService.deleteCandidate(id);
  }

  @Post('election')
  createElection(@Body() dto: CreateElectionDto, @CurrentUser() user: { id: string }) {
    return this.adminService.createElection(dto, user.id);
  }

  @Get('election')
  listElections() {
    return this.adminService.listElections();
  }

  @Post('election/:id/status')
  setStatus(
    @Param('id') id: string,
    @Body() dto: UpdateElectionStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.adminService.setElectionStatus(id, dto.status, user.id);
  }
}
