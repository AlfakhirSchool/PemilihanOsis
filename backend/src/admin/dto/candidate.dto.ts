import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCandidateDto {
  @IsUUID()
  election_id: string;

  @IsInt()
  nomor_urut: number;

  @IsString()
  @IsNotEmpty()
  nama_ketua: string;

  @IsString()
  @IsOptional()
  nama_wakil?: string;

  @IsString()
  @IsOptional()
  foto_url?: string;

  @IsString()
  @IsOptional()
  visi_misi?: string;
}
