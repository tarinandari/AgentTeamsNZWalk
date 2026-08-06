import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { WalkService } from './walk';

describe('WalkService', () => {
  let service: WalkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WalkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
