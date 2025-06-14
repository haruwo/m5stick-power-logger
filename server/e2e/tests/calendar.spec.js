const { test, expect } = require('@playwright/test');

test.describe('Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
  });

  test('should display calendar page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Calendar');
    await expect(page.locator('[data-testid="calendar-container"]')).toBeVisible();
  });

  test('should show current month by default', async ({ page }) => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    await expect(page.locator('[data-testid="calendar-header"]')).toContainText(currentMonth);
  });

  test('should navigate between months', async ({ page }) => {
    const prevButton = page.locator('[data-testid="prev-month"]');
    const nextButton = page.locator('[data-testid="next-month"]');
    
    await expect(prevButton).toBeVisible();
    await expect(nextButton).toBeVisible();
    
    await nextButton.click();
    await prevButton.click();
  });

  test('should show events on calendar days', async ({ page }) => {
    const eventDays = page.locator('[data-testid="calendar-day"][data-has-events="true"]');
    await expect(eventDays.first()).toBeVisible();
  });

  test('should show day details when clicked', async ({ page }) => {
    const dayWithEvents = page.locator('[data-testid="calendar-day"][data-has-events="true"]').first();
    await dayWithEvents.click();
    
    await expect(page.locator('[data-testid="day-details-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="day-events-list"]')).toBeVisible();
  });

  test('should filter events by device', async ({ page }) => {
    const deviceFilter = page.locator('[data-testid="calendar-device-filter"]');
    await expect(deviceFilter).toBeVisible();
    
    await deviceFilter.selectOption({ index: 1 });
  });

  test('should switch between month and week view', async ({ page }) => {
    const weekViewButton = page.locator('[data-testid="week-view-button"]');
    const monthViewButton = page.locator('[data-testid="month-view-button"]');
    
    await expect(weekViewButton).toBeVisible();
    await weekViewButton.click();
    
    await expect(page.locator('[data-testid="week-calendar"]')).toBeVisible();
    
    await monthViewButton.click();
    await expect(page.locator('[data-testid="month-calendar"]')).toBeVisible();
  });
});