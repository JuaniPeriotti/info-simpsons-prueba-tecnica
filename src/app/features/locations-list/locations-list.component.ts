import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { SimpsonsApiService } from '../../core/services/simpsons-api.service';
import { cdnImageUrl } from '../../core/image-url';
import { LocationsPage } from '../../core/models/location.model';
import { scrollToTop } from '../../core/scroll-to-top';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; page: LocationsPage };

@Component({
  selector: 'app-locations-list',
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  templateUrl: './locations-list.component.html',
  styleUrl: './locations-list.component.css'
})
export class LocationsListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(SimpsonsApiService);

  private readonly reloadTrigger = signal(0);

  readonly pageIndex = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const raw = Number(params.get('page'));
        return Number.isFinite(raw) && raw > 0 ? raw - 1 : 0;
      })
    ),
    { requireSync: true }
  );

  private readonly state = toSignal(
    combineLatest([this.route.queryParamMap, toObservable(this.reloadTrigger)]).pipe(
      switchMap(([params]) => {
        const raw = Number(params.get('page'));
        const page = Number.isFinite(raw) && raw > 0 ? raw : 1;

        return this.api.getLocationsPage(page).pipe(
          map((locationsPage): LoadState => ({ status: 'ready', page: locationsPage })),
          catchError(() => of<LoadState>({ status: 'error' }))
        );
      })
    ),
    { initialValue: { status: 'loading' } as LoadState }
  );

  readonly isLoading = () => this.state().status === 'loading';
  readonly isError = () => this.state().status === 'error';

  readonly locations = computed(() => {
    const current = this.state();
    return current.status === 'ready' ? current.page.results : [];
  });

  readonly totalCount = computed(() => {
    const current = this.state();
    return current.status === 'ready' ? current.page.count : 0;
  });

  readonly pageSize = 20;

  imageUrl(path: string | null): string | null {
    return cdnImageUrl(path, 200);
  }

  onPageChange(event: PageEvent): void {
    const page = event.pageIndex + 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page === 1 ? null : String(page) },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    scrollToTop();
  }

  retry(): void {
    this.reloadTrigger.update((n) => n + 1);
  }
}
