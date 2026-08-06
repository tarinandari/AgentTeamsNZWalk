import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateDifficultyRequest, Difficulty, UpdateDifficultyRequest } from './difficulty.model';

@Service()
export class DifficultyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/difficulties';

  getAll(): Observable<Difficulty[]> {
    return this.http.get<Difficulty[]>(this.baseUrl);
  }

  getById(id: string): Observable<Difficulty> {
    return this.http.get<Difficulty>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateDifficultyRequest): Observable<Difficulty> {
    return this.http.post<Difficulty>(this.baseUrl, request);
  }

  update(id: string, request: UpdateDifficultyRequest): Observable<Difficulty> {
    return this.http.patch<Difficulty>(`${this.baseUrl}/${id}`, request);
  }
}
