export interface Walk {
  id: string;
  name: string;
  description: string;
  lengthInKm: number;
  walkImageUrl: string | null;
  difficulty: { id: string; name: string };
  region: { id: string; name: string; code: string };
  subRegion: { id: number; subRegionName: string } | null;
}

export interface CreateWalkRequest {
  name: string;
  description: string;
  lengthInKm: number;
  walkImageUrl?: string | null;
  difficultyId: string;
  regionId: string;
  subRegionId?: number | null;
}

export type UpdateWalkRequest = Partial<CreateWalkRequest>;

export interface WalkFilter {
  regionId?: string;
  subRegionId?: number;
  difficultyId?: string;
  search?: string;
}
