import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { WalkService } from '../walk';
import { Walk } from '../walk.model';
import { RegionService } from '../../regions/region';
import { Region } from '../../regions/region.model';
import { SubRegionService } from '../../subregions/subregion';
import { SubRegion } from '../../subregions/subregion.model';
import { DifficultyService } from '../../difficulties/difficulty';
import { Difficulty } from '../../difficulties/difficulty.model';
import { MediaThumb } from '../../shared/media-thumb/media-thumb';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';

const DIFFICULTY_TONE_COUNT = 3;

@Component({
  selector: 'app-walk-list',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MediaThumb,
  ],
  templateUrl: './walk-list.html',
  styleUrl: './walk-list.scss',
})
export class WalkList {
  private readonly walkService = inject(WalkService);
  private readonly regionService = inject(RegionService);
  private readonly subRegionService = inject(SubRegionService);
  private readonly difficultyService = inject(DifficultyService);
  private readonly dialog = inject(MatDialog);
  private readonly searchInput$ = new Subject<string>();
  private readonly regionFilterChange$ = new Subject<string>();
  private readonly reload$ = new Subject<void>();

  readonly walks = signal<Walk[]>([]);
  readonly loading = signal(true);
  readonly searching = signal(false);
  readonly hasLoadedOnce = signal(false);
  readonly error = signal<string | null>(null);

  readonly regions = signal<Region[]>([]);
  readonly difficulties = signal<Difficulty[]>([]);
  readonly filterSubRegions = signal<SubRegion[]>([]);

  readonly filterRegionId = signal<string>('');
  readonly filterSubRegionId = signal<number | null>(null);
  readonly filterDifficultyId = signal<string>('');
  readonly searchText = signal('');

  private readonly difficultyToneById = computed(() => {
    const map = new Map<string, number>();
    this.difficulties().forEach((difficulty, index) => {
      map.set(difficulty.id, index % DIFFICULTY_TONE_COUNT);
    });
    return map;
  });

  constructor() {
    this.regionService.getAll().subscribe((regions) => this.regions.set(regions));
    this.difficultyService.getAll().subscribe((difficulties) => this.difficulties.set(difficulties));

    this.searchInput$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.reload$.next();
    });

    this.regionFilterChange$
      .pipe(switchMap((regionId) => (regionId ? this.subRegionService.getAll(regionId) : of([]))))
      .subscribe((subRegions) => this.filterSubRegions.set(subRegions));

    // A single trigger + switchMap so a slow earlier response (e.g. a debounced
    // search) can never land after a faster later one (e.g. a dropdown change)
    // and overwrite the correct results.
    this.reload$
      .pipe(
        startWith(undefined),
        switchMap(() => {
          if (this.hasLoadedOnce()) {
            this.searching.set(true);
          } else {
            this.loading.set(true);
          }
          return this.walkService
            .getAll({
              regionId: this.filterRegionId() || undefined,
              subRegionId: this.filterSubRegionId() ?? undefined,
              difficultyId: this.filterDifficultyId() || undefined,
              search: this.searchText() || undefined,
            })
            .pipe(catchError(() => of(null)));
        }),
      )
      .subscribe((walks) => {
        if (walks === null) {
          this.error.set('Failed to load walks. Please try again.');
        } else {
          this.walks.set(walks);
          this.error.set(null);
        }
        this.hasLoadedOnce.set(true);
        this.loading.set(false);
        this.searching.set(false);
      });
  }

  onSearchInput(value: string): void {
    this.searchText.set(value);
    this.searchInput$.next(value);
  }

  onRegionFilterChange(regionId: string): void {
    this.filterRegionId.set(regionId);
    this.filterSubRegionId.set(null);
    this.regionFilterChange$.next(regionId);
    this.reload$.next();
  }

  onSubRegionFilterChange(subRegionId: number | null): void {
    this.filterSubRegionId.set(subRegionId);
    this.reload$.next();
  }

  onDifficultyFilterChange(difficultyId: string): void {
    this.filterDifficultyId.set(difficultyId);
    this.reload$.next();
  }

  difficultyTone(difficultyId: string): number {
    return this.difficultyToneById().get(difficultyId) ?? 0;
  }

  deleteWalk(walk: Walk): void {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Delete walk?',
        message: `"${walk.name}" will be permanently removed. This can't be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.walkService.delete(walk.id).subscribe({
        next: () => this.reload$.next(),
        error: () => this.error.set('Failed to delete walk. Please try again.'),
      });
    });
  }
}
