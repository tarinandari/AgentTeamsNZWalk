export interface Region {
  id: string;
  code: string;
  name: string;
  regionImageUrl: string | null;
}

export interface CreateRegionRequest {
  code: string;
  name: string;
  regionImageUrl?: string;
}
