import { test, expect } from '@playwright/test';

test.describe('Responsive', () => {
  test('el grid de personajes muestra 3 columnas en mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a.card-link').first()).toBeVisible();

    const columnCount = await page.evaluate(() => {
      const grid = document.querySelector('.character-grid');
      if (!grid) return -1;
      return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    });

    expect(columnCount).toBe(3);
  });
});
