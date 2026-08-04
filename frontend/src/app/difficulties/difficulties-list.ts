import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { showSuccessSnackbar } from '../shared/success-snackbar';
import { difficultyBadgeTone } from '../walks/difficulty-badge';
import { Difficulty } from './difficulty.model';
import { DifficultyService } from './difficulty.service';

@Component({
  selector: 'app-difficulties-list',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
  ],
  templateUrl: './difficulties-list.html',
  styleUrl: './difficulties-list.scss',
})
export class DifficultiesList implements OnInit {
  private readonly difficultyService = inject(DifficultyService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly difficulties = signal<Difficulty[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);

  readonly difficultyBadgeTone = difficultyBadgeTone;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.difficultyService.getAll().subscribe({
      next: (data) => {
        this.difficulties.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load difficulties.');
        this.loading.set(false);
      },
    });
  }

  startEdit(difficulty: Difficulty): void {
    this.editingId.set(difficulty.id);
    this.error.set(null);
    this.form.patchValue({ name: difficulty.name });
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
        ? this.difficultyService.create(payload)
        : this.difficultyService.update(id, payload);

    request.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
        if (id === null) {
          showSuccessSnackbar(this.snackBar, 'Difficulty added successfully.');
        }
      },
      error: () =>
        this.error.set(
          id === null ? 'Failed to create difficulty.' : 'Failed to update difficulty.',
        ),
    });
  }
}
