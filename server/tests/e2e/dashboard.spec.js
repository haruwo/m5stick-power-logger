const { test, expect } = require('@playwright/test');

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page).toHaveTitle(/M5StickC Power Logger/);
    await expect(page.locator('h6')).toContainText('M5StickC Power Logger Dashboard');
  });

  test('should display navigation tabs', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(4);
    
    await expect(tabs.nth(0)).toContainText('Dashboard');
    await expect(tabs.nth(1)).toContainText('Calendar');
    await expect(tabs.nth(2)).toContainText('Gantt Chart');
    await expect(tabs.nth(3)).toContainText('Devices');
  });

  test('should switch between tabs', async ({ page }) => {
    // Click on Calendar tab
    await page.click('text=Calendar');
    await expect(page.locator('[role="tabpanel"]').nth(1)).toBeVisible();
    
    // Click on Gantt Chart tab
    await page.click('text=Gantt Chart');
    await expect(page.locator('[role="tabpanel"]').nth(2)).toBeVisible();
    
    // Click on Devices tab
    await page.click('text=Devices');
    await expect(page.locator('[role="tabpanel"]').nth(3)).toBeVisible();
    
    // Back to Dashboard
    await page.click('text=Dashboard');
    await expect(page.locator('[role="tabpanel"]').nth(0)).toBeVisible();
  });

  test('should display dashboard stats', async ({ page }) => {
    // Wait for dashboard stats to load
    await page.waitForSelector('[data-testid="dashboard-stats"]', { timeout: 10000 });
    
    // Check if stats cards are present
    const statsCards = page.locator('[data-testid="stat-card"]');
    await expect(statsCards).toHaveCountGreaterThan(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/dashboard/stats', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.reload();
    
    // Should show error message or retry mechanism
    const errorElement = page.locator('[data-testid="error-message"]');
    await expect(errorElement).toBeVisible({ timeout: 10000 });
  });
});