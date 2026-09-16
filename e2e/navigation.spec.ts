import { test, expect } from '@playwright/test';

test.describe('Navegación por pestañas', () => {
  test('cambia de sección y marca la pestaña activa', async ({ page }) => {
    await page.goto('/');
    const charactersTab = page.getByRole('tab', { name: 'Personajes' });
    const locationsTab = page.getByRole('tab', { name: 'Ubicaciones' });

    await expect(charactersTab).toHaveAttribute('aria-selected', 'true');

    await locationsTab.click();
    await expect(page).toHaveURL(/\/locations/);
    await expect(locationsTab).toHaveAttribute('aria-selected', 'true');
    await expect(charactersTab).toHaveAttribute('aria-selected', 'false');
  });
});
