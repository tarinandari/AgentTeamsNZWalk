import { IsOptional, IsUUID } from 'class-validator';

export class FindSubRegionsDto {
  @IsOptional()
  @IsUUID()
  regionId?: string;
}
