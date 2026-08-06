import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateWalkRequest, UpdateWalkRequest, Walk, WalkFilter } from './walk.model';

@Service()
export class WalkService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/walks';

  getAll(filter?: WalkFilter): Observable<Walk[]> {
    let params = new HttpParams();
    if (filter?.regionId) {
      params = params.set('regionId', filter.regionId);
    }
    if (filter?.subRegionId != null) {
      params = params.set('subRegionId', filter.subRegionId);
    }
    if (filter?.difficultyId) {
      params = params.set('difficultyId', filter.difficultyId);
    }
    if (filter?.search) {
      params = params.set('search', filter.search);
    }
    return this.http.get<Walk[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Walk> {
    return this.http.get<Walk>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateWalkRequest): Observable<Walk> {
    return this.http.post<Walk>(this.baseUrl, request);
  }

  update(id: string, request: UpdateWalkRequest): Observable<Walk> {
    return this.http.patch<Walk>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
