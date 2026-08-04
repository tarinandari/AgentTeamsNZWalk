export interface Difficulty {
  id: string;
  name: string;
}

export interface CreateDifficultyRequest {
  name: string;
}

export type UpdateDifficultyRequest = Partial<CreateDifficultyRequest>;
