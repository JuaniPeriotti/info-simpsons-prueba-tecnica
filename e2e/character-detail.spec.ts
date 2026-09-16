import { test, expect } from '@playwright/test';

test.describe('Detalle de personaje', () => {
  test('muestra los campos principales', async ({ page }) => {
    await page.goto('/character/1');
    await expect(page.getByRole('heading', { name: 'Homer Simpson' })).toBeVisible();
    await expect(page.getByText('Safety Inspector')).toBeVisible();
    await expect(page.getByText('Male')).toBeVisible();
    await expect(page.getByText('39')).toBeVisible();
    await expect(page.getByText('Doh!')).toBeVisible();
  });

  test('muestra fallback cuando falta un dato (edad null)', async ({ page }) => {
    await page.goto('/character/6'); // Abe Simpson II - age null en la API
    await expect(page.getByRole('heading', { name: 'Abe Simpson' })).toBeVisible();
    await expect(page.getByText('No disponible').first()).toBeVisible();
  });

  test('el link de primera aparición navega al episodio', async ({ page }) => {
    await page.goto('/character/1');
    await page.getByRole('link', { name: /Temporada 1, episodio 1/ }).click();
    await expect(page).toHaveURL(/\/episode\/1$/);
    await expect(page.getByRole('heading', { name: /Simpsons Roasting/ })).toBeVisible();
  });

  test('una frase larga hace wrap dentro de su chip en vez de desbordar la página', async ({ page }) => {
    await page.goto('/character/4'); // Lisa Simpson tiene una frase muy larga
    const longPhrase = page.getByText(/Well, I wish you wouldnt/);
    await expect(longPhrase).toBeVisible();

    const overflowsHorizontally = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflowsHorizontally).toBe(false);
  });
});
