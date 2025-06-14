const { test, expect } = require('@playwright/test');

test.describe('Devices Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/devices');
  });

  test('should display devices page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Devices');
    await expect(page.locator('[data-testid="devices-list"]')).toBeVisible();
  });

  test('should show add device button', async ({ page }) => {
    const addButton = page.locator('[data-testid="add-device-button"]');
    await expect(addButton).toBeVisible();
    await expect(addButton).toContainText('Add Device');
  });

  test('should open add device modal', async ({ page }) => {
    await page.locator('[data-testid="add-device-button"]').click();
    await expect(page.locator('[data-testid="add-device-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="device-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="device-mac-input"]')).toBeVisible();
  });

  test('should add a new device', async ({ page }) => {
    await page.locator('[data-testid="add-device-button"]').click();
    
    await page.locator('[data-testid="device-name-input"]').fill('Test Device');
    await page.locator('[data-testid="device-mac-input"]').fill('AA:BB:CC:DD:EE:FF');
    await page.locator('[data-testid="device-location-input"]').fill('Test Location');
    
    await page.locator('[data-testid="save-device-button"]').click();
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="devices-list"]')).toContainText('Test Device');
  });

  test('should filter devices by status', async ({ page }) => {
    const filterSelect = page.locator('[data-testid="device-filter"]');
    await expect(filterSelect).toBeVisible();
    
    await filterSelect.selectOption('active');
    await expect(page.locator('[data-testid="devices-list"] [data-status="active"]')).toBeVisible();
    
    await filterSelect.selectOption('inactive');
    await expect(page.locator('[data-testid="devices-list"] [data-status="inactive"]')).toBeVisible();
  });

  test('should search devices by name', async ({ page }) => {
    const searchInput = page.locator('[data-testid="device-search"]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('M5Stick');
    await expect(page.locator('[data-testid="devices-list"]')).toContainText('M5Stick');
  });

  test('should show device details', async ({ page }) => {
    const firstDevice = page.locator('[data-testid="device-item"]').first();
    await firstDevice.click();
    
    await expect(page.locator('[data-testid="device-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="device-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="device-mac"]')).toBeVisible();
    await expect(page.locator('[data-testid="device-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="device-last-seen"]')).toBeVisible();
  });
});