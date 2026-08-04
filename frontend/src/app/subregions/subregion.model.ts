export interface SubRegion {
  id: number;
  subRegionName: string;
  regionId: string;
}

export interface CreateSubRegionRequest {
  subRegionName: string;
  regionId: string;
}

export type UpdateSubRegionRequest = Partial<CreateSubRegionRequest>;
