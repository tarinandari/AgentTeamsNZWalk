import { Walk } from './walk.entity';

export interface WalkResponse {
  id: string;
  name: string;
  description: string;
  lengthInKm: number;
  walkImageUrl: string | null;
  difficulty: { id: string; name: string };
  region: { id: string; name: string; code: string };
  subRegion: { id: number; subRegionName: string } | null;
}

export function toWalkResponse(walk: Walk): WalkResponse {
  return {
    id: walk.id,
    name: walk.name,
    description: walk.description,
    lengthInKm: walk.lengthInKm,
    walkImageUrl: walk.walkImageUrl,
    difficulty: { id: walk.difficulty.id, name: walk.difficulty.name },
    region: {
      id: walk.region.id,
      name: walk.region.name,
      code: walk.region.code,
    },
    subRegion: walk.subRegion
      ? { id: walk.subRegion.id, subRegionName: walk.subRegion.subRegionName }
      : null,
  };
}
