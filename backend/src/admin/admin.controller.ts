import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { AdminJwtGuard } from '../common/guards/admin-jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { CreateCandidateDto } from './dto/candidate.dto';
import { CreateElectionDto, RevealVoteDto, UpdateElectionStatusDto } from './dto/election.dto';
import { GenerateCodesDto } from './dto/code.dto';

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

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

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/candidates',
        filename: (_req, file, cb) => {
          const name = randomBytes(16).toString('hex') + extname(file.originalname).toLowerCase();
          cb(null, name);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
          cb(new BadRequestException('Cuma JPG/PNG/WEBP yang diterima'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File tidak ada');
    return { url: `/uploads/candidates/${file.filename}` };
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

  @Post('election/:id/codes/generate')
  generateCodes(
    @Param('id') id: string,
    @Body() dto: GenerateCodesDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.adminService.generateCodes(id, dto.count, user.id);
  }

  @Get('election/:id/codes')
  listCodes(@Param('id') id: string) {
    return this.adminService.listCodes(id);
  }
}
