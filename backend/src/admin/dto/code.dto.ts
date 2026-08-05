import { IsInt, Max, Min } from 'class-validator';

export class GenerateCodesDto {
  @IsInt()
  @Min(1)
  @Max(5000)
  count: number;
}
