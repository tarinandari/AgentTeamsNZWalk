import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateSubRegionRequest, SubRegion } from './subregion.model';

@Injectable({ providedIn: 'root' })
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

  create(payload: CreateSubRegionRequest): Observable<SubRegion> {
    return this.http.post<SubRegion>(this.baseUrl, payload);
  }
}
