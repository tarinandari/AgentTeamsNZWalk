import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateWalkRequest, UpdateWalkRequest, Walk, WalkFilters } from './walk.model';

@Injectable({ providedIn: 'root' })
export class WalksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/walks';

  getAll(filters: WalkFilters = {}): Observable<Walk[]> {
    let params = new HttpParams();
    if (filters.regionId) {
      params = params.set('regionId', filters.regionId);
    }
    if (filters.subRegionId) {
      params = params.set('subRegionId', filters.subRegionId);
    }
    if (filters.difficultyId) {
      params = params.set('difficultyId', filters.difficultyId);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    return this.http.get<Walk[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Walk> {
    return this.http.get<Walk>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateWalkRequest): Observable<Walk> {
    return this.http.post<Walk>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateWalkRequest): Observable<Walk> {
    return this.http.patch<Walk>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
