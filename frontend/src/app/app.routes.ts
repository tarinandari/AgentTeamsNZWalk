import { Routes } from '@angular/router';
import { WalkList } from './walks/walk-list/walk-list';
import { WalkForm } from './walks/walk-form/walk-form';
import { RegionList } from './regions/region-list/region-list';
import { RegionForm } from './regions/region-form/region-form';
import { SubRegionList } from './subregions/subregion-list/subregion-list';
import { SubRegionForm } from './subregions/subregion-form/subregion-form';
import { DifficultyList } from './difficulties/difficulty-list/difficulty-list';
import { DifficultyForm } from './difficulties/difficulty-form/difficulty-form';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'walks' },
  { path: 'walks', component: WalkList },
  { path: 'walks/new', component: WalkForm },
  { path: 'walks/:id/edit', component: WalkForm },
  { path: 'regions', component: RegionList },
  { path: 'regions/new', component: RegionForm },
  { path: 'regions/:id/edit', component: RegionForm },
  { path: 'subregions', component: SubRegionList },
  { path: 'subregions/new', component: SubRegionForm },
  { path: 'subregions/:id/edit', component: SubRegionForm },
  { path: 'difficulties', component: DifficultyList },
  { path: 'difficulties/new', component: DifficultyForm },
  { path: 'difficulties/:id/edit', component: DifficultyForm },
];
