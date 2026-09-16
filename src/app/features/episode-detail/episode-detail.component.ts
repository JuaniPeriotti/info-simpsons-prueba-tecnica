import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SimpsonsApiService } from '../../core/services/simpsons-api.service';
import { Episode } from '../../core/models/episode.model';
import { cdnImageUrl } from '../../core/image-url';

type DetailState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'ready'; episode: Episode };

@Component({
  selector: 'app-episode-detail',
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './episode-detail.component.html',
  styleUrl: './episode-detail.component.css'
})
export class EpisodeDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SimpsonsApiService);

  private readonly reloadTrigger = signal(0);

  private readonly state = toSignal(
    combineLatest([this.route.paramMap, toObservable(this.reloadTrigger)]).pipe(
      switchMap(([params]) => {
        const id = Number(params.get('id'));

        if (!Number.isInteger(id) || id <= 0) {
          return of<DetailState>({ status: 'not-found' });
        }

        return this.api.getEpisodeById(id).pipe(
          map((episode): DetailState => ({ status: 'ready', episode })),
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

  readonly episode = () => {
    const current = this.state();
    return current.status === 'ready' ? current.episode : null;
  };

  readonly imageUrl = () => cdnImageUrl(this.episode()?.image_path, 500);

  retry(): void {
    this.reloadTrigger.update((n) => n + 1);
  }
}
