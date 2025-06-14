const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard title', async ({ page }) => {
    await expect(page).toHaveTitle(/M5StickC Power Logger/);
    await expect(page.locator('h1')).toContainText('Power Logger Dashboard');
  });

  test('should show navigation menu', async ({ page }) => {
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-devices"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-calendar"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();
  });

  test('should display power consumption chart', async ({ page }) => {
    await expect(page.locator('[data-testid="power-chart"]')).toBeVisible();
  });

  test('should show device statistics', async ({ page }) => {
    await expect(page.locator('[data-testid="device-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-devices"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-devices"]')).toBeVisible();
  });

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    const refreshButton = page.locator('[data-testid="refresh-button"]');
    await expect(refreshButton).toBeVisible();
    
    await refreshButton.click();
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeHidden({ timeout: 10000 });
  });
});