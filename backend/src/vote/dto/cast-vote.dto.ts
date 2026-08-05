import { IsNotEmpty, IsString } from 'class-validator';

export class CastVoteDto {
  @IsString()
  @IsNotEmpty()
  candidate_id: string;
}
