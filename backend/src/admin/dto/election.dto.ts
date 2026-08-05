import { IsDateString, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateElectionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['SMP'])
  jenjang: 'SMP';

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;
}

export class UpdateElectionStatusDto {
  @IsIn(['draft', 'active', 'closed'])
  status: 'draft' | 'active' | 'closed';
}

export class RevealVoteDto {
  @IsString()
  @IsNotEmpty()
  vote_id: string;
}
