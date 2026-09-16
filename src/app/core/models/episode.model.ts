export interface Episode {
  id: number;
  name: string;
  season: number;
  episode_number: number;
  airdate: string | null;
  image_path: string | null;
  synopsis: string | null;
  /** Solo viene en GET /episodes/:id; el listado paginado no lo incluye. */
  description?: string | null;
}

export interface EpisodesPage {
  count: number;
  next: string | null;
  prev: string | null;
  pages: number;
  results: Episode[];
}
