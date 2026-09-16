import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SimpsonsApiService } from '../../core/services/simpsons-api.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { cdnImageUrl } from '../../core/image-url';
import { CharacterDetail } from '../../core/models/character.model';

type DetailState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; character: CharacterDetail };

@Component({
  selector: 'app-character-detail',
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './character-detail.component.html',
  styleUrl: './character-detail.component.css'
})
export class CharacterDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SimpsonsApiService);
  private readonly favorites = inject(FavoritesService);

  private readonly reloadTrigger = signal(0);

  private readonly state = toSignal(
    combineLatest([this.route.paramMap, toObservable(this.reloadTrigger)]).pipe(
      switchMap(([params]) => {
        const id = Number(params.get('id'));

        if (!Number.isInteger(id) || id <= 0) {
          return of<DetailState>({ status: 'not-found' });
        }

        return this.api.getCharacterById(id).pipe(
          map((character): DetailState => ({ status: 'ready', character })),
          catchError((err: HttpErrorResponse) =>
            of<DetailState>({ status: err.status === 404 ? 'not-found' : 'error' })
          )
        );
      })
    ),
    { initialValue: { status: 'loading' } as DetailState }
  );

  readonly isLoading = () => this.state().status === 'loading';
  readonly isNotFound = () => this.state().status === 'not-found';
  readonly isError = () => this.state().status === 'error';

  readonly character = () => {
    const current = this.state();
    return current.status === 'ready' ? current.character : null;
  };

  readonly imageUrl = () => cdnImageUrl(this.character()?.portrait_path, 500);

  isFavorite(id: number): boolean {
    return this.favorites.isFavorite(id);
  }

  toggleFavorite(id: number): void {
    this.favorites.toggle(id);
  }

  retry(): void {
    this.reloadTrigger.update((n) => n + 1);
  }
}
