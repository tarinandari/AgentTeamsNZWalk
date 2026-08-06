export class CreateWalkDto {
  name: string;
  description: string;
  lengthInKm: number;
  walkImageUrl?: string | null;
  difficultyId: string;
  regionId: string;
  subRegionId?: number | null;
}
