import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SubRegionService } from './subregion';

describe('SubRegionService', () => {
  let service: SubRegionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SubRegionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
