import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { Region } from '../regions/region.model';
import { RegionService } from '../regions/region.service';
import { SubRegion } from './subregion.model';
import { SubRegionService } from './subregion.service';

@Component({
  selector: 'app-subregions-list',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
  ],
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
  readonly editingId = signal<number | null>(null);

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

  startEdit(subRegion: SubRegion): void {
    this.editingId.set(subRegion.id);
    this.error.set(null);
    this.form.patchValue({
      subRegionName: subRegion.subRegionName,
      regionId: subRegion.regionId,
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const payload = this.form.getRawValue();
    const id = this.editingId();
    const request =
      id === null
        ? this.subRegionService.create(payload)
        : this.subRegionService.update(id, payload);

    request.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: () =>
        this.error.set(
          id === null ? 'Failed to create sub region.' : 'Failed to update sub region.',
        ),
    });
  }
}
