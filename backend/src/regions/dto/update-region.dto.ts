import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRegionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  regionImageUrl?: string;
}
