import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { CharacterStore } from '../../core/services/character-store';
import { FavoritesService } from '../../core/services/favorites.service';
import { CharacterCardComponent } from './character-card.component';
import { normalize } from '../../core/text-utils';
import { scrollToTop } from '../../core/scroll-to-top';

const PAGE_SIZE = 20;

// La API no documenta qué valores puede traer `status`/`gender` (además de
// Alive/Deceased o Male/Female aparecen otros como "Noncanon"), así que en vez
// de hardcodear una lista fija, las opciones del filtro se calculan a partir
// de los valores que realmente aparecen en los datos ya cargados.
const KNOWN_LABELS: Record<string, string> = {
  Alive: 'Vivo',
  Deceased: 'Fallecido',
  Male: 'Masculino',
  Female: 'Femenino'
};

function buildFilterOptions(
  characters: { value: string | null }[],
  allLabel: string
): { value: string; label: string }[] {
  const distinctValues = new Set<string>();
  let hasMissing = false;

  for (const { value } of characters) {
    value ? distinctValues.add(value) : (hasMissing = true);
  }

  const options = Array.from(distinctValues)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: KNOWN_LABELS[value] ?? value }));

  if (hasMissing) {
    options.push({ value: 'unknown', label: 'Desconocido' });
  }

  return [{ value: 'all', label: allLabel }, ...options];
}

@Component({
  selector: 'app-character-list',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatPaginatorModule,
    CharacterCardComponent
  ],
  templateUrl: './character-list.component.html',
  styleUrl: './character-list.component.css'
})
export class CharacterListComponent {
  private readonly store = inject(CharacterStore);
  private readonly favorites = inject(FavoritesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly statusOptions = computed(() =>
    buildFilterOptions(
      this.store.allCharacters().map((c) => ({ value: c.status })),
      'Todos los estados'
    )
  );

  readonly genderOptions = computed(() =>
    buildFilterOptions(
      this.store.allCharacters().map((c) => ({ value: c.gender })),
      'Todos los géneros'
    )
  );

  readonly loading = this.store.loading;
  readonly fatalError = this.store.fatalError;
  readonly hasPartialErrors = this.store.hasPartialErrors;
  readonly failedPagesCount = computed(() => this.store.failedPages().length);
  readonly progressPercent = this.store.progressPercent;

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    requireSync: true
  });

  readonly searchTerm = computed(() => this.queryParamMap().get('q') ?? '');
  readonly statusFilter = computed(() => this.queryParamMap().get('status') ?? 'all');
  readonly genderFilter = computed(() => this.queryParamMap().get('gender') ?? 'all');
  readonly favoritesOnly = computed(() => this.queryParamMap().get('fav') === '1');

  private readonly searchInput$ = new Subject<string>();

  readonly filteredCharacters = computed(() => {
    const term = normalize(this.searchTerm().trim());
    const status = this.statusFilter();
    const gender = this.genderFilter();
    const onlyFavorites = this.favoritesOnly();
    const favoriteIds = this.favorites.favoriteIds();

    return this.store.allCharacters().filter((character) => {
      if (term && !normalize(character.name).includes(term)) return false;
      if (status !== 'all' && (character.status ?? 'unknown') !== status) return false;
      if (gender !== 'all' && (character.gender ?? 'unknown') !== gender) return false;
      if (onlyFavorites && !favoriteIds.has(character.id)) return false;
      return true;
    });
  });

  private readonly requestedPageIndex = computed(() => {
    const raw = Number(this.queryParamMap().get('page'));
    return Number.isFinite(raw) && raw > 0 ? raw - 1 : 0;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredCharacters().length / PAGE_SIZE))
  );

  // Si un filtro deja menos resultados que la página pedida, la "clampeamos"
  // en vez de mostrar una página vacía o romper.
  readonly pageIndex = computed(() =>
    Math.min(this.requestedPageIndex(), this.totalPages() - 1)
  );

  readonly pagedCharacters = computed(() => {
    const start = this.pageIndex() * PAGE_SIZE;
    return this.filteredCharacters().slice(start, start + PAGE_SIZE);
  });

  readonly pageSize = PAGE_SIZE;

  constructor() {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.updateQueryParams({ q: value.trim() || null, page: null });
      });
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  onStatusChange(value: string): void {
    this.updateQueryParams({ status: value === 'all' ? null : value, page: null });
  }

  onGenderChange(value: string): void {
    this.updateQueryParams({ gender: value === 'all' ? null : value, page: null });
  }

  onFavoritesOnlyToggle(checked: boolean): void {
    this.updateQueryParams({ fav: checked ? '1' : null, page: null });
  }

  onPageChange(event: PageEvent): void {
    const page = event.pageIndex + 1;
    this.updateQueryParams({ page: page === 1 ? null : String(page) });
    scrollToTop();
  }

  retryFailedPages(): void {
    this.store.retryFailedPages();
  }

  reloadEverything(): void {
    this.store.reload();
  }

  private updateQueryParams(params: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
