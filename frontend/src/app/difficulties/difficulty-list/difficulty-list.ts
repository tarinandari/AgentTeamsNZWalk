import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DifficultyService } from '../difficulty';
import { Difficulty } from '../difficulty.model';

@Component({
  selector: 'app-difficulty-list',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './difficulty-list.html',
  styleUrl: './difficulty-list.scss',
})
export class DifficultyList {
  private readonly difficultyService = inject(DifficultyService);

  readonly difficulties = signal<Difficulty[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.difficultyService.getAll().subscribe({
      next: (difficulties) => {
        this.difficulties.set(difficulties);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load difficulties. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
