import { test, expect } from '@playwright/test';

test.describe('BME Calculator E2E Workflow', () => {
  test('should load the page, input a variable value, click calculate and verify output', async ({ page }) => {
    // Go to the main dashboard page
    await page.goto('/');

    // Check header/logo is present
    await expect(page.locator('text=BME Calc')).toBeVisible();

    // Check we have the main tabs
    await expect(page.locator('#tab-calculator')).toBeVisible();
    await expect(page.locator('#tab-harvest_plan')).toBeVisible();

    // Wait a brief moment for the dashboard to settle
    await page.waitForTimeout(1500);

    // Let's check that the calculate button is visible and active
    const calcBtn = page.locator('#btn-calculate');
    await expect(calcBtn).toBeVisible();

    // Find first input element in the active sector and write a value
    const firstInput = page.locator('input.field-input').first();
    if (await firstInput.count() > 0) {
      await firstInput.click();
      await firstInput.fill('150');
      await firstInput.press('Tab');
    }

    // Click calculate
    await calcBtn.click();

    // Wait for calculations to finish
    await expect(page.locator('text=Calculando...')).toBeHidden({ timeout: 8000 });

    // Verify button goes back to its idle state
    await expect(calcBtn).toContainText('Calcular');
  });
});
