export type ImageSize = 200 | 500 | 1280;

/** Arma la URL del CDN para un `*_path` de personaje, episodio o ubicación. */
export function cdnImageUrl(
  path: string | null | undefined,
  size: ImageSize = 200
): string | null {
  return path ? `https://cdn.thesimpsonsapi.com/${size}${path}` : null;
}
