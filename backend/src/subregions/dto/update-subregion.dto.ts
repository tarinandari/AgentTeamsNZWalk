import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateSubRegionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  subRegionName?: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;
}
