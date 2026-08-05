import { Module } from '@nestjs/common';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';
import { PublicController } from './public.controller';

@Module({
  controllers: [ElectionController, PublicController],
  providers: [ElectionService],
})
export class ElectionModule {}
