import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class FindWalksDto {
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subRegionId?: number;

  @IsOptional()
  @IsUUID()
  difficultyId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
