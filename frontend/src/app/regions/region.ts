import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateRegionRequest, Region, UpdateRegionRequest } from './region.model';

@Service()
export class RegionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/regions';

  getAll(): Observable<Region[]> {
    return this.http.get<Region[]>(this.baseUrl);
  }

  getById(id: string): Observable<Region> {
    return this.http.get<Region>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateRegionRequest): Observable<Region> {
    return this.http.post<Region>(this.baseUrl, request);
  }

  update(id: string, request: UpdateRegionRequest): Observable<Region> {
    return this.http.patch<Region>(`${this.baseUrl}/${id}`, request);
  }
}
