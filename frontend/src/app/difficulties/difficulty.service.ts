import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateDifficultyRequest, Difficulty } from './difficulty.model';

@Injectable({ providedIn: 'root' })
export class DifficultyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/difficulties';

  getAll(): Observable<Difficulty[]> {
    return this.http.get<Difficulty[]>(this.baseUrl);
  }

  create(payload: CreateDifficultyRequest): Observable<Difficulty> {
    return this.http.post<Difficulty>(this.baseUrl, payload);
  }
}
