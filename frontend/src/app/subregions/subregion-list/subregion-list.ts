import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubRegionService } from '../subregion';
import { SubRegion } from '../subregion.model';
import { RegionService } from '../../regions/region';
import { Region } from '../../regions/region.model';

@Component({
  selector: 'app-subregion-list',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './subregion-list.html',
  styleUrl: './subregion-list.scss',
})
export class SubRegionList {
  private readonly subRegionService = inject(SubRegionService);
  private readonly regionService = inject(RegionService);

  readonly subRegions = signal<SubRegion[]>([]);
  readonly regionsById = signal<Map<string, Region>>(new Map());
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly rows = computed(() =>
    this.subRegions().map((subRegion) => ({
      subRegion,
      regionName: this.regionsById().get(subRegion.regionId)?.name ?? subRegion.regionId,
    })),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      subRegions: this.subRegionService.getAll(),
      regions: this.regionService.getAll(),
    }).subscribe({
      next: ({ subRegions, regions }) => {
        this.subRegions.set(subRegions);
        this.regionsById.set(new Map(regions.map((region) => [region.id, region])));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load subregions. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
