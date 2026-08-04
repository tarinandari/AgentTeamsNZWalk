import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Region } from './region.model';
import { RegionService } from './region.service';

@Component({
  selector: 'app-regions-list',
  imports: [ReactiveFormsModule],
  templateUrl: './regions-list.html',
  styleUrl: './regions-list.scss',
})
export class RegionsList implements OnInit {
  private readonly regionService = inject(RegionService);
  private readonly fb = inject(FormBuilder);

  readonly regions = signal<Region[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    this.regionService
      .create({
        code: raw.code,
        name: raw.name,
        regionImageUrl: raw.regionImageUrl || undefined,
      })
      .subscribe({
        next: () => {
          this.form.reset();
          this.load();
        },
        error: () => this.error.set('Failed to create region.'),
      });
  }
}
