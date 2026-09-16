import { test, expect } from '@playwright/test';

test.describe('Ubicaciones', () => {
  test('lista ubicaciones con imagen, ciudad y uso', async ({ page }) => {
    await page.goto('/locations');
    const firstLocation = page.locator('mat-card', { hasText: '742 Evergreen Terrace' });
    await expect(firstLocation).toBeVisible();
    await expect(firstLocation.getByText('Springfield')).toBeVisible();
    await expect(firstLocation.getByText('Residential')).toBeVisible();
  });

  test('pagina del lado del servidor y cambia la URL', async ({ page }) => {
    await page.goto('/locations');
    await expect(page.locator('mat-card', { hasText: '742 Evergreen Terrace' })).toBeVisible();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator('mat-card', { hasText: '742 Evergreen Terrace' })).toHaveCount(0);
  });
});
