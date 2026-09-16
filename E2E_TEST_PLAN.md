# Plan de testing E2E — Info Simpsons

Cobertura pensada para verificar, contra la app real corriendo (`npm start` + `npx playwright test`), cada punto de la consigna del examen. No son mocks: los tests pegan contra `thesimpsonsapi.com` real, salvo los casos de "error de red" que interceptan la request a propósito para forzar el fallo.

Herramienta: [Playwright](https://playwright.dev/) (`e2e/*.spec.ts`). Ejecutar con `npx playwright test` (headless) o `npx playwright test --ui` (modo interactivo).

## 1. Listado (sección 3.1)

| # | Caso | Resultado esperado |
|---|------|---------------------|
| 1.1 | Cargar `/` | Aparecen personajes con nombre, imagen, estado y ocupación visibles |
| 1.2 | Barra de progreso mientras carga | Se muestra y desaparece al terminar la carga inicial |

## 2. Búsqueda (sección 3.2)

| # | Caso | Resultado esperado |
|---|------|---------------------|
| 2.1 | Buscar "homer" (minúscula) | Aparece "Homer Simpson" — confirma case-insensitive |
| 2.2 | Buscar un nombre inexistente | Estado vacío explícito ("Ningún personaje coincide...") |
| 2.3 | Forzar error de red (route intercepted) | Estado de error visible, con botón de reintentar |

## 3. Filtros (sección 3.3)

| # | Caso | Resultado esperado |
|---|------|---------------------|
| 3.1 | Filtrar por Estado = Deceased | Solo aparecen personajes fallecidos |
| 3.2 | Combinar búsqueda "flanders" + Género = Male | Solo Flanders masculinos |
| 3.3 | Las opciones de Estado/Género incluyen valores no obvios | Confirma que el dropdown se arma dinámicamente desde los datos, no hardcodeado |

## 4. Paginación (sección 3.4)

| # | Caso | Resultado esperado |
|---|------|---------------------|
| 4.1 | Ir a la página 2 | La URL pasa a tener `?page=2` y el contenido cambia |
| 4.2 | Aplicar un filtro y cambiar de página | El filtro se mantiene (no se resetea) |
| 4.3 | Cambiar de página | El scroll sube al tope automáticamente |

## 5. Detalle de personaje (sección 4)

| # | Caso | Resultado esperado |
|---|------|---------------------|
| 5.1 | Entrar al detalle de Homer | Se ven nombre, imagen, edad, género, ocupación, estado y frases |
| 5.2 | Personaje con un campo faltante (edad null) | Se muestra "No disponible" en vez de vacío o error |
| 5.3 | Link "Primera aparición" | Navega al detalle del episodio correspondiente |

## 6. Favoritos (sección 5)

| # | Caso | Resultado esperado |
|---|------|---------------------|
| 6.1 | Marcar un personaje como favorito | El ícono cambia a "favorito lleno" |
| 6.2 | Activar "Solo favoritos" | Solo se listan los marcados |
| 6.3 | Recargar la página (F5) | El favorito sigue marcado (persiste en localStorage) |

## 7. Manejo de errores (sección 6)

| # | Caso | Resultado esperado |
|---|------|---------------------|
| 7.1 | Id de personaje que no existe (`/character/999999`) | "Este personaje no existe" |
| 7.2 | Id no numérico (`/character/abc`) | Mismo mensaje, sin llegar a pegarle a la API |
| 7.3 | Id de episodio que no existe | "Este episodio no existe" |
| 7.4 | Cortar la red en la carga inicial | Pantalla de error con botón "Reintentar" |

## 8. Bonus: episodios y ubicaciones

| # | Caso | Resultado esperado |
|---|------|---------------------|
| 8.1 | Pestaña "Ubicaciones" | Lista ubicaciones con imagen, ciudad y chip de uso |
| 8.2 | Paginar ubicaciones | Cambia el contenido y la URL (`?page=2`), server-side |

## 9. Navegación y responsive

| # | Caso | Resultado esperado |
|---|------|---------------------|
| 9.1 | Click en pestaña "Ubicaciones" | Navega y la marca como activa; "Personajes" deja de estarlo |
| 9.2 | Viewport mobile (375px) | El grid de personajes muestra 3 columnas |

## Fuera de alcance de esta suite

- Tests unitarios de servicios/componentes en aislamiento (Karma/Jasmine) — no son E2E, quedan para otra instancia.
- Rendimiento/carga bajo estrés de la API real.
