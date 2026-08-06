import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RegionService } from '../region';
import { Region } from '../region.model';
import { MediaThumb } from '../../shared/media-thumb/media-thumb';

@Component({
  selector: 'app-region-list',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MediaThumb],
  templateUrl: './region-list.html',
  styleUrl: './region-list.scss',
})
export class RegionList {
  private readonly regionService = inject(RegionService);

  readonly regions = signal<Region[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.regionService.getAll().subscribe({
      next: (regions) => {
        this.regions.set(regions);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load regions. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
