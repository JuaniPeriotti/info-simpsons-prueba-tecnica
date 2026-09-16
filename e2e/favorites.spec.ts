import { test, expect } from '@playwright/test';

test.describe('Favoritos', () => {
  test('marcar, filtrar por favoritos, y persistir tras reload', async ({ page }) => {
    await page.goto('/');

    const homerCard = page.locator('a.card-link', { hasText: 'Homer Simpson' });
    const favButton = homerCard.getByRole('button');
    await expect(favButton).toHaveAttribute('aria-label', 'Agregar a favoritos');
    await favButton.click();
    await expect(favButton).toHaveAttribute('aria-label', 'Quitar de favoritos');

    await page.getByLabel('Solo favoritos').click();
    await expect(page.locator('a.card-link', { hasText: 'Homer Simpson' })).toBeVisible();
    await expect(page.locator('a.card-link', { hasText: 'Marge Simpson' })).toHaveCount(0);
    await expect(page).toHaveURL(/fav=1/);

    await page.reload();
    await expect(page.locator('a.card-link', { hasText: 'Homer Simpson' })).toBeVisible();
    await expect(page.locator('a.card-link', { hasText: 'Marge Simpson' })).toHaveCount(0);
  });
});
