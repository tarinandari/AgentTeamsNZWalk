import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Difficulty } from '../difficulties/difficulty.model';
import { DifficultyService } from '../difficulties/difficulty.service';
import { Region } from '../regions/region.model';
import { RegionService } from '../regions/region.service';
import { SubRegion } from '../subregions/subregion.model';
import { SubRegionService } from '../subregions/subregion.service';
import { ConfirmDialog, ConfirmDialogData } from '../shared/confirm-dialog/confirm-dialog';
import { difficultyBadgeTone } from './difficulty-badge';
import { Walk } from './walk.model';
import { WalksService } from './walks.service';

@Component({
  selector: 'app-walks-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './walks-list.html',
  styleUrl: './walks-list.scss',
})
export class WalksList implements OnInit {
  private readonly walksService = inject(WalksService);
  private readonly regionService = inject(RegionService);
  private readonly subRegionService = inject(SubRegionService);
  private readonly difficultyService = inject(DifficultyService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  readonly walks = signal<Walk[]>([]);
  readonly regions = signal<Region[]>([]);
  readonly subRegions = signal<SubRegion[]>([]);
  readonly difficulties = signal<Difficulty[]>([]);
  readonly loading = signal(false);
  readonly searching = signal(false);
  readonly error = signal<string | null>(null);
  readonly difficultyBadgeTone = difficultyBadgeTone;
  readonly imageLoadErrors = signal<ReadonlySet<string>>(new Set());

  private hasLoadedOnce = false;

  readonly filterForm = this.fb.nonNullable.group({
    regionId: [''],
    subRegionId: [''],
    difficultyId: [''],
    search: [''],
  });

  ngOnInit(): void {
    this.regionService.getAll().subscribe((r) => this.regions.set(r));
    this.difficultyService.getAll().subscribe((d) => this.difficulties.set(d));
    this.loadWalks();

    this.filterForm.controls.regionId.valueChanges.subscribe((regionId) => {
      this.filterForm.controls.subRegionId.setValue('', { emitEvent: false });
      if (regionId) {
        this.subRegionService.getAll(regionId).subscribe((s) => this.subRegions.set(s));
      } else {
        this.subRegions.set([]);
      }
      this.loadWalks();
    });
    this.filterForm.controls.subRegionId.valueChanges.subscribe(() => this.loadWalks());
    this.filterForm.controls.difficultyId.valueChanges.subscribe(() => this.loadWalks());
    this.filterForm.controls.search.valueChanges.pipe(debounceTime(300)).subscribe(() => this.loadWalks());
  }

  loadWalks(): void {
    const raw = this.filterForm.getRawValue();
    if (this.hasLoadedOnce) {
      this.searching.set(true);
    } else {
      this.loading.set(true);
    }
    this.walksService
      .getAll({
        regionId: raw.regionId || undefined,
        subRegionId: raw.subRegionId ? Number(raw.subRegionId) : undefined,
        difficultyId: raw.difficultyId || undefined,
        search: raw.search || undefined,
      })
      .subscribe({
        next: (walks) => {
          this.walks.set(walks);
          this.loading.set(false);
          this.searching.set(false);
          this.hasLoadedOnce = true;
        },
        error: () => {
          this.error.set('Failed to load walks.');
          this.loading.set(false);
          this.searching.set(false);
          this.hasLoadedOnce = true;
        },
      });
  }

  onImageError(walkId: string): void {
    this.imageLoadErrors.update((ids) => new Set(ids).add(walkId));
  }

  deleteWalk(walk: Walk): void {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
      data: {
        title: 'Delete walk',
        message: `Are you sure you want to delete "${walk.name}"? This cannot be undone.`,
        confirmLabel: 'Delete',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.walksService.delete(walk.id).subscribe({
        next: () => this.loadWalks(),
        error: () => this.error.set('Failed to delete walk.'),
      });
    });
  }
}
