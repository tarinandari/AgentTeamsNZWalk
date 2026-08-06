import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateSubRegionRequest, SubRegion, UpdateSubRegionRequest } from './subregion.model';

@Service()
export class SubRegionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/subregions';

  getAll(regionId?: string): Observable<SubRegion[]> {
    let params = new HttpParams();
    if (regionId) {
      params = params.set('regionId', regionId);
    }
    return this.http.get<SubRegion[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<SubRegion> {
    return this.http.get<SubRegion>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateSubRegionRequest): Observable<SubRegion> {
    return this.http.post<SubRegion>(this.baseUrl, request);
  }

  update(id: number, request: UpdateSubRegionRequest): Observable<SubRegion> {
    return this.http.patch<SubRegion>(`${this.baseUrl}/${id}`, request);
  }
}
