import { test, expect } from '@playwright/test';

test.describe('Manejo de errores', () => {
  test('personaje con id fuera de rango muestra "no existe"', async ({ page }) => {
    await page.goto('/character/999999');
    await expect(page.getByText('Este personaje no existe')).toBeVisible({ timeout: 15_000 });
  });

  test('id no numérico no llega a pegarle a la API', async ({ page }) => {
    const calledUrls: string[] = [];
    page.on('request', (req) => calledUrls.push(req.url()));

    await page.goto('/character/abc');
    await expect(page.getByText('Este personaje no existe')).toBeVisible();
    expect(calledUrls.some((u) => u.includes('/characters/abc'))).toBe(false);
  });

  test('episodio inexistente muestra "no existe"', async ({ page }) => {
    await page.goto('/episode/999999');
    await expect(page.getByText('Este episodio no existe')).toBeVisible({ timeout: 15_000 });
  });

  test('si la carga inicial falla por completo, muestra error con reintentar', async ({ page }) => {
    await page.route('**/api/characters*', (route) => route.abort());
    await page.goto('/');
    await expect(page.getByText(/No se pudo conectar/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
  });
});
