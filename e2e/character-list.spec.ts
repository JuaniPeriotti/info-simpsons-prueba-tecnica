import { test, expect } from '@playwright/test';

test.describe('Listado de personajes', () => {
  test('carga personajes con nombre, imagen, estado y ocupación', async ({ page }) => {
    await page.goto('/');
    const homerCard = page.locator('a.card-link', { hasText: 'Homer Simpson' });
    await expect(homerCard).toBeVisible();
    await expect(homerCard.locator('img')).toBeVisible();
    await expect(homerCard.getByText('Safety Inspector')).toBeVisible();
    await expect(homerCard.getByText('Alive')).toBeVisible();
  });
});

test.describe('Búsqueda', () => {
  test('encuentra resultados sin importar mayúsculas', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Buscar por nombre').fill('homer');
    await expect(page.locator('a.card-link', { hasText: 'Homer Simpson' })).toBeVisible();
  });

  test('muestra estado vacío cuando no hay resultados', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Buscar por nombre').fill('zzzxnoexiste');
    await expect(page.getByText('Ningún personaje coincide')).toBeVisible();
  });
});

test.describe('Filtros', () => {
  test('filtra por estado', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Estado').click();
    await page.getByRole('option', { name: 'Fallecido' }).click();
    await expect(page.locator('a.card-link', { hasText: 'Maude Flanders' })).toBeVisible();
    await expect(page.locator('a.card-link', { hasText: 'Homer Simpson' })).toHaveCount(0);
  });

  test('combina búsqueda y filtro de género', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Buscar por nombre').fill('flanders');
    await page.getByLabel('Género').click();
    await page.getByRole('option', { name: 'Masculino' }).click();
    await expect(page.locator('a.card-link', { hasText: 'Ned Flanders' })).toBeVisible();
    await expect(page.locator('a.card-link', { hasText: 'Maude Flanders' })).toHaveCount(0);
  });
});

test.describe('Paginación', () => {
  test('avanza de página y actualiza la URL', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page).toHaveURL(/page=2/);
  });

  test('mantiene el filtro al cambiar de página', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Género').click();
    await page.getByRole('option', { name: 'Masculino' }).click();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page).toHaveURL(/gender=Male/);
    await expect(page).toHaveURL(/page=2/);
  });

  test('sube el scroll al tope al cambiar de página', async ({ page }) => {
    await page.goto('/');
    await page.mouse.wheel(0, 2000);
    await page.getByRole('button', { name: 'Next page' }).click();
    await page.waitForTimeout(500);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});
