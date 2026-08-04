import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Difficulty } from '../difficulties/difficulty.model';
import { DifficultyService } from '../difficulties/difficulty.service';
import { Region } from '../regions/region.model';
import { RegionService } from '../regions/region.service';
import { SubRegion } from '../subregions/subregion.model';
import { SubRegionService } from '../subregions/subregion.service';
import { WalksService } from './walks.service';

@Component({
  selector: 'app-walk-form',
  imports: [ReactiveFormsModule],
  templateUrl: './walk-form.html',
  styleUrl: './walk-form.scss',
})
export class WalkForm implements OnInit {
  private readonly walksService = inject(WalksService);
  private readonly regionService = inject(RegionService);
  private readonly subRegionService = inject(SubRegionService);
  private readonly difficultyService = inject(DifficultyService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly regions = signal<Region[]>([]);
  readonly subRegions = signal<SubRegion[]>([]);
  readonly difficulties = signal<Difficulty[]>([]);
  readonly error = signal<string | null>(null);
  readonly walkId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.walkId() !== null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    lengthInKm: [0, [Validators.required, Validators.min(0)]],
    walkImageUrl: [''],
    difficultyId: ['', Validators.required],
    regionId: ['', Validators.required],
    subRegionId: [''],
  });

  private isInitialEditLoad = false;

  ngOnInit(): void {
    this.regionService.getAll().subscribe((r) => this.regions.set(r));
    this.difficultyService.getAll().subscribe((d) => this.difficulties.set(d));

    this.form.controls.regionId.valueChanges.subscribe((regionId) => {
      if (!this.isInitialEditLoad) {
        this.form.controls.subRegionId.setValue('');
      }
      if (regionId) {
        this.subRegionService.getAll(regionId).subscribe((s) => this.subRegions.set(s));
      } else {
        this.subRegions.set([]);
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.walkId.set(id);
      this.isInitialEditLoad = true;
      this.walksService.getById(id).subscribe({
        next: (walk) => {
          this.form.patchValue({
            name: walk.name,
            description: walk.description,
            lengthInKm: walk.lengthInKm,
            walkImageUrl: walk.walkImageUrl ?? '',
            difficultyId: walk.difficulty.id,
            regionId: walk.region.id,
            subRegionId: walk.subRegion ? String(walk.subRegion.id) : '',
          });
          this.isInitialEditLoad = false;
        },
        error: () => {
          this.error.set('Failed to load walk.');
          this.isInitialEditLoad = false;
        },
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      description: raw.description,
      lengthInKm: Number(raw.lengthInKm),
      walkImageUrl: raw.walkImageUrl || undefined,
      difficultyId: raw.difficultyId,
      regionId: raw.regionId,
      subRegionId: raw.subRegionId ? Number(raw.subRegionId) : undefined,
    };

    const id = this.walkId();
    const request = id ? this.walksService.update(id, payload) : this.walksService.create(payload);

    request.subscribe({
      next: () => this.router.navigate(['/walks']),
      error: () => this.error.set('Failed to save walk.'),
    });
  }

  cancel(): void {
    this.router.navigate(['/walks']);
  }
}
