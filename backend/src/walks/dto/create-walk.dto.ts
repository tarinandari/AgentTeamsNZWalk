import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateWalkDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  lengthInKm: number;

  @IsOptional()
  @IsString()
  walkImageUrl?: string;

  @IsUUID()
  @IsNotEmpty()
  difficultyId: string;

  @IsUUID()
  @IsNotEmpty()
  regionId: string;

  @IsOptional()
  @IsInt()
  subRegionId?: number;
}
