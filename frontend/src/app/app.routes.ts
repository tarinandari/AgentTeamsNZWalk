import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'walks', pathMatch: 'full' },
  { path: 'walks', loadComponent: () => import('./walks/walks-list').then((m) => m.WalksList) },
  { path: 'walks/new', loadComponent: () => import('./walks/walk-form').then((m) => m.WalkForm) },
  { path: 'walks/:id/edit', loadComponent: () => import('./walks/walk-form').then((m) => m.WalkForm) },
  { path: 'regions', loadComponent: () => import('./regions/regions-list').then((m) => m.RegionsList) },
  {
    path: 'subregions',
    loadComponent: () => import('./subregions/subregions-list').then((m) => m.SubregionsList),
  },
  {
    path: 'difficulties',
    loadComponent: () => import('./difficulties/difficulties-list').then((m) => m.DifficultiesList),
  },
];
