import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, finalize, from, mergeMap, of } from 'rxjs';
import { Character } from '../models/character.model';
import { SimpsonsApiService } from './simpsons-api.service';

const CONCURRENT_REQUESTS = 6;

/**
 * La API solo pagina (?page=1..60) y no soporta búsqueda ni filtros propios.
 * Por eso este store trae el universo completo de personajes una única vez
 * (en paralelo, con concurrencia limitada) y lo guarda en memoria: búsqueda,
 * filtros y paginación se resuelven después, 100% del lado del cliente.
 */
@Injectable({ providedIn: 'root' })
export class CharacterStore {
  private readonly api = inject(SimpsonsApiService);

  private readonly _allCharacters = signal<Character[]>([]);
  private readonly _loading = signal(true);
  private readonly _loadedPages = signal(0);
  private readonly _totalPages = signal(0);
  private readonly _failedPages = signal<number[]>([]);
  private readonly _fatalError = signal<string | null>(null);

  readonly allCharacters = this._allCharacters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly failedPages = this._failedPages.asReadonly();
  readonly fatalError = this._fatalError.asReadonly();

  readonly progressPercent = computed(() => {
    const total = this._totalPages();
    return total === 0 ? 0 : Math.round((this._loadedPages() / total) * 100);
  });

  readonly hasPartialErrors = computed(() => this._failedPages().length > 0);

  constructor() {
    this.loadAll();
  }

  retryFailedPages(): void {
    const pending = this._failedPages();
    if (pending.length === 0) return;
    this._failedPages.set([]);
    this.fetchPages(pending);
  }

  /** Reintenta desde cero, para cuando ni siquiera la página 1 pudo cargarse. */
  reload(): void {
    this._allCharacters.set([]);
    this._loadedPages.set(0);
    this._totalPages.set(0);
    this._failedPages.set([]);
    this.loadAll();
  }

  private loadAll(): void {
    this._loading.set(true);
    this._fatalError.set(null);

    // Pedimos la página 1 sola primero: es la que nos dice cuántas páginas
    // existen en total (`pages`), dato que necesitamos antes de poder
    // "abanicar" el resto de los pedidos en paralelo.
    this.api.getCharactersPage(1).subscribe({
      next: (firstPage) => {
        this._totalPages.set(firstPage.pages);
        this._allCharacters.set(firstPage.results);
        this._loadedPages.set(1);

        const remainingPages = Array.from(
          { length: firstPage.pages - 1 },
          (_, i) => i + 2
        );

        if (remainingPages.length === 0) {
          this._loading.set(false);
          return;
        }

        this.fetchPages(remainingPages);
      },
      error: () => {
        this._fatalError.set(
          'No se pudo conectar con la API de Los Simpson. Verificá tu conexión e intentá de nuevo.'
        );
        this._loading.set(false);
      }
    });
  }

  private fetchPages(pages: number[]): void {
    this._loading.set(true);

    from(pages)
      .pipe(
        mergeMap(
          (page) =>
            this.api.getCharactersPage(page).pipe(
              catchError(() => {
                this._failedPages.update((current) => [...current, page]);
                return of(null);
              })
            ),
          CONCURRENT_REQUESTS
        ),
        finalize(() => this._loading.set(false))
      )
      .subscribe((result) => {
        if (!result) return;

        this._allCharacters.update((current) =>
          [...current, ...result.results].sort((a, b) => a.id - b.id)
        );
        this._loadedPages.update((n) => n + 1);
      });
  }
}
