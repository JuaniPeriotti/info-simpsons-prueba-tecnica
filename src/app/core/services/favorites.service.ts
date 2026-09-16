import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'simpsons-explorer:favorites';

function readFromStorage(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === 'number') : []);
  } catch {
    // localStorage bloqueado (modo privado) o JSON corrupto: arrancamos sin favoritos
    // en vez de romper el arranque de la app.
    return new Set();
  }
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly _favoriteIds = signal<Set<number>>(readFromStorage());
  readonly favoriteIds = this._favoriteIds.asReadonly();

  constructor() {
    effect(() => {
      const ids = Array.from(this._favoriteIds());
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      } catch {
        // Si no se puede persistir, la sesión actual sigue funcionando igual.
      }
    });
  }

  isFavorite(id: number): boolean {
    return this._favoriteIds().has(id);
  }

  toggle(id: number): void {
    this._favoriteIds.update((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
}
