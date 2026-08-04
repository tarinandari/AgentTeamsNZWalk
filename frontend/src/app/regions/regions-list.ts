import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { Region } from './region.model';
import { RegionService } from './region.service';

@Component({
  selector: 'app-regions-list',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatListModule,
  ],
  templateUrl: './regions-list.html',
  styleUrl: './regions-list.scss',
})
export class RegionsList implements OnInit {
  private readonly regionService = inject(RegionService);
  private readonly fb = inject(FormBuilder);

  readonly regions = signal<Region[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly imageLoadErrors = signal<ReadonlySet<string>>(new Set());

  readonly form = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    regionImageUrl: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.regionService.getAll().subscribe({
      next: (data) => {
        this.regions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load regions.');
        this.loading.set(false);
      },
    });
  }

  startEdit(region: Region): void {
    this.editingId.set(region.id);
    this.error.set(null);
    this.form.patchValue({
      code: region.code,
      name: region.name,
      regionImageUrl: region.regionImageUrl ?? '',
    });
  }

  onImageError(regionId: string): void {
    this.imageLoadErrors.update((ids) => new Set(ids).add(regionId));
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      code: raw.code,
      name: raw.name,
      regionImageUrl: raw.regionImageUrl || undefined,
    };
    const id = this.editingId();
    const request =
      id === null ? this.regionService.create(payload) : this.regionService.update(id, payload);

    request.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: () =>
        this.error.set(id === null ? 'Failed to create region.' : 'Failed to update region.'),
    });
  }
}
