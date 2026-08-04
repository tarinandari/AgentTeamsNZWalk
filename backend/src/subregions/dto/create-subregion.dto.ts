import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSubRegionDto {
  @IsString()
  @IsNotEmpty()
  subRegionName: string;

  @IsUUID()
  @IsNotEmpty()
  regionId: string;
}
