# Info Simpsons

Aplicación para explorar los personajes del universo de Los Simpson, consumiendo [The Simpsons API](https://thesimpsonsapi.com/api). Hecha en Angular 20 (standalone components + signals) con Angular Material.

## Cómo ejecutar el proyecto

Requisitos: Node.js 20.11+ / 22.11+ (Angular 20) y npm.

```bash
npm install
npm start
```

Abrir `http://localhost:4200`. La app llama directamente a `https://thesimpsonsapi.com/api` desde el navegador, no requiere backend propio ni variables de entorno.

Otros comandos útiles:

```bash
npm run build   # build de producción en dist/
npm test        # unit tests (Karma/Jasmine)
npm run e2e     # tests end-to-end (Playwright) — ver E2E_TEST_PLAN.md
```

## Funcionalidad

- **Listado** de personajes con nombre, imagen, estado y ocupación.
- **Búsqueda** por nombre (sin distinguir mayúsculas/acentos), con estado de "sin resultados" y de error diferenciados.
- **Filtros** por Estado y Género, combinables entre sí y con la búsqueda.
- **Paginación** que no pierde la búsqueda ni los filtros aplicados.
- **Detalle** de personaje: nombre, imagen, edad, género, ocupación, estado, frases y su primera aparición (enlazada a un detalle de episodio).
- **Favoritos** persistentes entre recargas.
- **Bonus:** detalle de episodio (`/episode/:id`) y una pantalla de ubicaciones de Springfield (`/locations`), paginada.

## Decisiones y problemas encontrados

### La API no soporta búsqueda ni filtros propios

No hay documentación adjunta a la consigna, así que exploré la API real en `https://thesimpsonsapi.com`. El único endpoint de listado es `GET /api/characters?page=N` y **el único query param soportado es `page`** (20 resultados por página, fijo). No existe `?search=`, `?name=`, `?status=`, etc.

Decisión: en vez de simular una búsqueda/filtro que solo mirara la página actual (lo que daría resultados incompletos y confusos), la app trae **las 60 páginas una sola vez al iniciar** (`CharacterStore`, en `src/app/core/services/character-store.ts`), en paralelo con concurrencia limitada a 6 requests simultáneos, y guarda el resultado en memoria. A partir de ahí, búsqueda, filtros y paginación se resuelven **100% en el cliente** sobre ese array, de forma instantánea y consistente.

El costo es una carga inicial de ~1182 personajes (unos segundos), que se comunica con una barra de progreso. Con más tiempo, una alternativa sería cachear ese dataset (IndexedDB o similar) para no repetir la carga completa en cada visita — se dejó afuera por tiempo y porque agregaba lógica de invalidación de caché no evaluada en la consigna.

### Estado de búsqueda/filtros/página: en la URL, no en localStorage

La consigna sugiere persistir el estado de la búsqueda/filtros/paginación. Inicialmente iba a usar `localStorage`, pero terminé optando por sincronizar `search/status/gender/page` como **query params de la ruta** (`router.navigate({ queryParams, queryParamsHandling: 'merge', replaceUrl: true })`), porque:

- Es el patrón estándar de Angular Router para estado de listados.
- El estado queda en la URL: compartible, bookmarkeable, y el botón "atrás" del navegador funciona sin código adicional.
- Sobrevive a un F5 igual que localStorage, sin necesidad de rehidratar nada a mano en el arranque del componente.

`replaceUrl: true` evita que cada tecla del buscador cree una entrada nueva en el historial del navegador.

**Los favoritos sí van en `localStorage`** (`FavoritesService`), porque no tiene sentido que un favorito dependa de una URL puntual y sí necesita sobrevivir entre sesiones.

### Los valores de "Estado" y "Género" no están documentados

Al probar, aparecieron valores de `status` que no esperaba (`Alive`, `Deceased`, pero también `Noncanon`, `Destroyed Icon`, `Fictional`, etc.). Hardcodear un dropdown fijo con "Vivo/Fallecido" hubiese ocultado esos personajes del filtro sin avisar. Por eso las opciones de los filtros se calculan dinámicamente a partir de los valores que efectivamente aparecen en el dataset ya cargado (`buildFilterOptions` en `character-list.component.ts`), traduciendo al español los valores conocidos (Alive/Deceased/Male/Female) y dejando el resto tal cual viene de la API.

### Manejo de situaciones inesperadas (sección 6 de la consigna)

| Situación | Cómo se maneja |
|---|---|
| La API tarda en responder | Cada request tiene un `timeout()` de 10s (RxJS) en `SimpsonsApiService`; si vence, se trata como error. |
| La API responde con error / cae la conexión | Si falla la página 1 (no se puede ni empezar), se muestra una pantalla de error con botón "Reintentar". Si fallan páginas intermedias, la app sigue funcionando con lo que sí cargó y muestra un banner no bloqueante ("no se pudieron cargar N páginas") con su propio botón de reintento. |
| Búsqueda sin resultados | Estado vacío explícito ("Ningún personaje coincide…"), distinto del estado de error. |
| Personaje solicitado no existe | Un id no numérico se detecta antes de llamar a la API; un id numérico que no existe recibe 404 de la API. Ambos casos muestran "Este personaje no existe" en vez de romper la vista. |
| Dato no disponible | Los campos nullable (`age`, `gender`, `occupation`, `status`, `birthdate`) se tipan como `T | null` en el modelo TypeScript, y cada lugar que los muestra tiene un fallback ("No disponible"). |

### Bonus: episodios y ubicaciones, con dos estrategias de carga distintas

El detalle de personaje ya traía gratis el dato de `first_appearance_ep` (episodio, temporada, número); lo convertí en un link a `/episode/:id`, que reutiliza el mismo patrón de estados (loading/not-found/error) que el detalle de personaje.

Para "Ubicaciones" (`/locations`) decidí **no** repetir la estrategia de "traer todo de una" de `CharacterStore`. Ahí la justificación era combinar búsqueda + filtros sobre el universo completo; acá solo hace falta una vidriera paginada, así que alcanza con pedir una página por vez con el `?page=` nativo de la API (sin acumular las 24 páginas en memoria). Es un ejemplo de que la estrategia de carga se elige según lo que la pantalla necesita, no un patrón único aplicado a todo. Por la misma razón, no le agregué búsqueda ni filtros: hubiera requerido volver a traer todo el dataset, y no era lo que se pedía para el bonus.

### Angular Material

Se usó para no invertir tiempo en CSS a mano (la consigna aclara que el diseño visual no se evalúa salvo que rompa el uso): toolbar, cards, inputs, selects, paginador, spinner y chips salen "gratis" y consistentes entre sí.

### Testing

Además de probar todo a mano en el navegador durante el desarrollo, hay una suite E2E con [Playwright](https://playwright.dev/) (`e2e/*.spec.ts`, plan detallado en [E2E_TEST_PLAN.md](./E2E_TEST_PLAN.md)) que corre contra la app real — pega a `thesimpsonsapi.com` de verdad, salvo los casos de error de red que interceptan la request a propósito. Cubre listado, búsqueda (con y sin resultados), filtros combinados, paginación (URL + scroll), detalle con fallback de datos faltantes, favoritos + persistencia, los 404/ids inválidos, ubicaciones, navegación por pestañas y el layout de 3 columnas en mobile. `npm run e2e` para correrla.
