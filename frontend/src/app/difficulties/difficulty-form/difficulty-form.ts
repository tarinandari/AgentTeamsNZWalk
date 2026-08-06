import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DifficultyService } from '../difficulty';
import { NotifyService } from '../../shared/notify';

@Component({
  selector: 'app-difficulty-form',
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
  templateUrl: './difficulty-form.html',
  styleUrl: './difficulty-form.scss',
})
export class DifficultyForm {
  private readonly fb = inject(FormBuilder);
  private readonly difficultyService = inject(DifficultyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotifyService);

  readonly difficultyId = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.difficultyId.set(id);
      this.isEditMode.set(true);
      this.difficultyService.getById(id).subscribe({
        next: (difficulty) => this.form.patchValue({ name: difficulty.name }),
        error: () => this.error.set('Failed to load difficulty.'),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const id = this.difficultyId();
    this.submitting.set(true);
    this.error.set(null);
    const save = id
      ? this.difficultyService.update(id, value)
      : this.difficultyService.create(value);

    save.subscribe({
      next: () => {
        this.submitting.set(false);
        if (!id) {
          this.notify.success(`Difficulty "${value.name}" created.`);
        }
        this.router.navigate(['/difficulties']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Failed to save difficulty. Please try again.');
      },
    });
  }
}
