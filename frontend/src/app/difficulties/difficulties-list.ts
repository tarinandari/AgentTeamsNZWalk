import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Difficulty } from './difficulty.model';
import { DifficultyService } from './difficulty.service';

@Component({
  selector: 'app-difficulties-list',
  imports: [ReactiveFormsModule],
  templateUrl: './difficulties-list.html',
  styleUrl: './difficulties-list.scss',
})
export class DifficultiesList implements OnInit {
  private readonly difficultyService = inject(DifficultyService);
  private readonly fb = inject(FormBuilder);

  readonly difficulties = signal<Difficulty[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.difficultyService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.form.reset();
        this.load();
      },
      error: () => this.error.set('Failed to create difficulty.'),
    });
  }
}
