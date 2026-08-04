import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Region } from '../regions/region.model';
import { RegionService } from '../regions/region.service';
import { SubRegion } from './subregion.model';
import { SubRegionService } from './subregion.service';

@Component({
  selector: 'app-subregions-list',
  imports: [ReactiveFormsModule],
  templateUrl: './subregions-list.html',
  styleUrl: './subregions-list.scss',
})
export class SubregionsList implements OnInit {
  private readonly subRegionService = inject(SubRegionService);
  private readonly regionService = inject(RegionService);
  private readonly fb = inject(FormBuilder);

  readonly subRegions = signal<SubRegion[]>([]);
  readonly regions = signal<Region[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    subRegionName: ['', Validators.required],
    regionId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.regionService.getAll().subscribe((r) => this.regions.set(r));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.subRegionService.getAll().subscribe({
      next: (data) => {
        this.subRegions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load sub regions.');
        this.loading.set(false);
      },
    });
  }

  regionName(regionId: string): string {
    return this.regions().find((r) => r.id === regionId)?.name ?? 'Unknown';
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.subRegionService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.form.reset();
        this.load();
      },
      error: () => this.error.set('Failed to create sub region.'),
    });
  }
}
