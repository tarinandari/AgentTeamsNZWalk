import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDifficultyDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
