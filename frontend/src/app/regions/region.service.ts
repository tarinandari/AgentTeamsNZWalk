import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateRegionRequest, Region, UpdateRegionRequest } from './region.model';

@Injectable({ providedIn: 'root' })
export class RegionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/regions';

  getAll(): Observable<Region[]> {
    return this.http.get<Region[]>(this.baseUrl);
  }

  create(payload: CreateRegionRequest): Observable<Region> {
    return this.http.post<Region>(this.baseUrl, payload);
  }

  update(id: string, payload: UpdateRegionRequest): Observable<Region> {
    return this.http.patch<Region>(`${this.baseUrl}/${id}`, payload);
  }
}
