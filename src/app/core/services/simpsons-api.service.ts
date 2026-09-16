import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { CharacterDetail, CharactersPage } from '../models/character.model';
import { Episode, EpisodesPage } from '../models/episode.model';
import { LocationsPage } from '../models/location.model';

const BASE_URL = 'https://thesimpsonsapi.com/api';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Capa fina sobre HttpClient: un método por endpoint, sin lógica de negocio.
 * El timeout vive acá porque es una preocupación de "transporte", no de estado de la app.
 */
@Injectable({ providedIn: 'root' })
export class SimpsonsApiService {
  private readonly http = inject(HttpClient);

  getCharactersPage(page: number): Observable<CharactersPage> {
    return this.http
      .get<CharactersPage>(`${BASE_URL}/characters`, { params: { page } })
      .pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  getCharacterById(id: number): Observable<CharacterDetail> {
    return this.http
      .get<CharacterDetail>(`${BASE_URL}/characters/${id}`)
      .pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  getEpisodeById(id: number): Observable<Episode> {
    return this.http
      .get<Episode>(`${BASE_URL}/episodes/${id}`)
      .pipe(timeout(REQUEST_TIMEOUT_MS));
  }

  getLocationsPage(page: number): Observable<LocationsPage> {
    return this.http
      .get<LocationsPage>(`${BASE_URL}/locations`, { params: { page } })
      .pipe(timeout(REQUEST_TIMEOUT_MS));
  }
}
