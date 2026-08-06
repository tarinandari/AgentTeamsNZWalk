import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DifficultyService } from './difficulty';

describe('DifficultyService', () => {
  let service: DifficultyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DifficultyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
