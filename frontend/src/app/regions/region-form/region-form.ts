import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RegionService } from '../region';
import { NotifyService } from '../../shared/notify';

@Component({
  selector: 'app-region-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './region-form.html',
  styleUrl: './region-form.scss',
})
export class RegionForm {
  private readonly fb = inject(FormBuilder);
  private readonly regionService = inject(RegionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotifyService);

  readonly regionId = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    regionImageUrl: [''],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.regionId.set(id);
      this.isEditMode.set(true);
      this.regionService.getById(id).subscribe({
        next: (region) => {
          this.form.patchValue({
            code: region.code,
            name: region.name,
            regionImageUrl: region.regionImageUrl ?? '',
          });
        },
        error: () => this.error.set('Failed to load region.'),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request = {
      code: value.code,
      name: value.name,
      regionImageUrl: value.regionImageUrl || null,
    };

    const id = this.regionId();
    this.submitting.set(true);
    this.error.set(null);
    const save = id
      ? this.regionService.update(id, request)
      : this.regionService.create(request);

    save.subscribe({
      next: () => {
        this.submitting.set(false);
        if (!id) {
          this.notify.success(`Region "${value.name}" created.`);
        }
        this.router.navigate(['/regions']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Failed to save region. Please try again.');
      },
    });
  }
}
