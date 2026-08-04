import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDifficultyDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
