const { test, expect } = require('@playwright/test');

test.describe('Timeline View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/timeline');
  });

  test('should display timeline page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Timeline');
    await expect(page.locator('[data-testid="timeline-container"]')).toBeVisible();
  });

  test('should show time range selector', async ({ page }) => {
    await expect(page.locator('[data-testid="time-range-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="start-time-picker"]')).toBeVisible();
    await expect(page.locator('[data-testid="end-time-picker"]')).toBeVisible();
  });

  test('should display timeline events', async ({ page }) => {
    await expect(page.locator('[data-testid="timeline-events"]')).toBeVisible();
  });

  test('should filter events by device', async ({ page }) => {
    const deviceFilter = page.locator('[data-testid="device-filter"]');
    await expect(deviceFilter).toBeVisible();
    
    await deviceFilter.selectOption({ index: 1 });
    await expect(page.locator('[data-testid="timeline-events"]')).toBeVisible();
  });

  test('should zoom timeline', async ({ page }) => {
    const zoomInButton = page.locator('[data-testid="zoom-in"]');
    const zoomOutButton = page.locator('[data-testid="zoom-out"]');
    
    await expect(zoomInButton).toBeVisible();
    await expect(zoomOutButton).toBeVisible();
    
    await zoomInButton.click();
    await zoomOutButton.click();
  });

  test('should show event details on hover', async ({ page }) => {
    const firstEvent = page.locator('[data-testid="timeline-event"]').first();
    await firstEvent.hover();
    
    await expect(page.locator('[data-testid="event-tooltip"]')).toBeVisible();
  });

  test('should export timeline data', async ({ page }) => {
    const exportButton = page.locator('[data-testid="export-button"]');
    await expect(exportButton).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('timeline');
  });
});