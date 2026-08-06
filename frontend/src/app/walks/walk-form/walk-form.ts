import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { WalkService } from '../walk';
import { RegionService } from '../../regions/region';
import { Region } from '../../regions/region.model';
import { SubRegionService } from '../../subregions/subregion';
import { SubRegion } from '../../subregions/subregion.model';
import { DifficultyService } from '../../difficulties/difficulty';
import { Difficulty } from '../../difficulties/difficulty.model';
import { NotifyService } from '../../shared/notify';

@Component({
  selector: 'app-walk-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './walk-form.html',
  styleUrl: './walk-form.scss',
})
export class WalkForm {
  private readonly fb = inject(FormBuilder);
  private readonly walkService = inject(WalkService);
  private readonly regionService = inject(RegionService);
  private readonly subRegionService = inject(SubRegionService);
  private readonly difficultyService = inject(DifficultyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotifyService);

  readonly walkId = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly regions = signal<Region[]>([]);
  readonly subRegions = signal<SubRegion[]>([]);
  readonly difficulties = signal<Difficulty[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    lengthInKm: [0, [Validators.required, Validators.min(0.1)]],
    walkImageUrl: [''],
    difficultyId: ['', Validators.required],
    regionId: ['', Validators.required],
    subRegionId: this.fb.control<number | null>(null),
  });

  constructor() {
    this.regionService.getAll().subscribe((regions) => this.regions.set(regions));
    this.difficultyService.getAll().subscribe((difficulties) => this.difficulties.set(difficulties));

    this.form.controls.regionId.valueChanges.subscribe((regionId) => {
      if (regionId) {
        this.loadSubRegions(regionId);
      } else {
        this.subRegions.set([]);
        this.form.patchValue({ subRegionId: null }, { emitEvent: false });
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.walkId.set(id);
      this.isEditMode.set(true);
      this.walkService.getById(id).subscribe({
        next: (walk) => {
          this.form.patchValue(
            {
              name: walk.name,
              description: walk.description,
              lengthInKm: walk.lengthInKm,
              walkImageUrl: walk.walkImageUrl ?? '',
              difficultyId: walk.difficulty.id,
              regionId: walk.region.id,
              subRegionId: walk.subRegion?.id ?? null,
            },
            { emitEvent: false },
          );
          this.loadSubRegions(walk.region.id, walk.subRegion?.id ?? null);
        },
        error: () => this.error.set('Failed to load walk.'),
      });
    }
  }

  private loadSubRegions(regionId: string, preserveSubRegionId?: number | null): void {
    this.subRegionService.getAll(regionId).subscribe((subRegions) => {
      this.subRegions.set(subRegions);
      const stillValid =
        preserveSubRegionId != null && subRegions.some((sr) => sr.id === preserveSubRegionId);
      this.form.patchValue(
        { subRegionId: stillValid ? preserveSubRegionId! : null },
        { emitEvent: false },
      );
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request = {
      name: value.name,
      description: value.description,
      lengthInKm: value.lengthInKm,
      walkImageUrl: value.walkImageUrl || null,
      difficultyId: value.difficultyId,
      regionId: value.regionId,
      subRegionId: value.subRegionId,
    };

    const id = this.walkId();
    this.submitting.set(true);
    this.error.set(null);
    const save = id ? this.walkService.update(id, request) : this.walkService.create(request);

    save.subscribe({
      next: () => {
        this.submitting.set(false);
        if (!id) {
          this.notify.success(`Walk "${value.name}" created.`);
        }
        this.router.navigate(['/walks']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Failed to save walk. Please try again.');
      },
    });
  }
}
