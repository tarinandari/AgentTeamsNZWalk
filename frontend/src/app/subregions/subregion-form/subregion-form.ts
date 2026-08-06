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
import { SubRegionService } from '../subregion';
import { RegionService } from '../../regions/region';
import { Region } from '../../regions/region.model';
import { NotifyService } from '../../shared/notify';

@Component({
  selector: 'app-subregion-form',
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
  templateUrl: './subregion-form.html',
  styleUrl: './subregion-form.scss',
})
export class SubRegionForm {
  private readonly fb = inject(FormBuilder);
  private readonly subRegionService = inject(SubRegionService);
  private readonly regionService = inject(RegionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotifyService);

  readonly subRegionId = signal<number | null>(null);
  readonly isEditMode = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly regions = signal<Region[]>([]);

  readonly form = this.fb.nonNullable.group({
    subRegionName: ['', Validators.required],
    regionId: ['', Validators.required],
  });

  constructor() {
    this.regionService.getAll().subscribe((regions) => this.regions.set(regions));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.subRegionId.set(id);
      this.isEditMode.set(true);
      this.subRegionService.getById(id).subscribe({
        next: (subRegion) => {
          this.form.patchValue({
            subRegionName: subRegion.subRegionName,
            regionId: subRegion.regionId,
          });
        },
        error: () => this.error.set('Failed to load subregion.'),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const id = this.subRegionId();
    this.submitting.set(true);
    this.error.set(null);
    const save = id
      ? this.subRegionService.update(id, value)
      : this.subRegionService.create(value);

    save.subscribe({
      next: () => {
        this.submitting.set(false);
        if (!id) {
          this.notify.success(`SubRegion "${value.subRegionName}" created.`);
        }
        this.router.navigate(['/subregions']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Failed to save subregion. Please try again.');
      },
    });
  }
}
