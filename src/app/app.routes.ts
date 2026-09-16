import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/character-list/character-list.component').then(
        (m) => m.CharacterListComponent
      )
  },
  {
    path: 'character/:id',
    loadComponent: () =>
      import('./features/character-detail/character-detail.component').then(
        (m) => m.CharacterDetailComponent
      )
  },
  {
    path: 'episode/:id',
    loadComponent: () =>
      import('./features/episode-detail/episode-detail.component').then(
        (m) => m.EpisodeDetailComponent
      )
  },
  {
    path: 'locations',
    loadComponent: () =>
      import('./features/locations-list/locations-list.component').then(
        (m) => m.LocationsListComponent
      )
  },
  { path: '**', redirectTo: '' }
];
