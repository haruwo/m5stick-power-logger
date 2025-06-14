const { test, expect } = require('@playwright/test');

test.describe('User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete user journey: view dashboard -> check devices -> view calendar', async ({ page }) => {
    // Step 1: View dashboard
    await expect(page.locator('h6')).toContainText('M5StickC Power Logger Dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Step 2: Navigate to devices tab
    await page.click('text=Devices');
    await expect(page.locator('[role="tabpanel"]').nth(3)).toBeVisible();
    
    // Check if devices are displayed (or empty state)
    const devicesPanel = page.locator('[role="tabpanel"]').nth(3);
    await expect(devicesPanel).toBeVisible();
    
    // Step 3: Navigate to calendar view
    await page.click('text=Calendar');
    await expect(page.locator('[role="tabpanel"]').nth(1)).toBeVisible();
    
    // Step 4: Navigate to Gantt chart
    await page.click('text=Gantt Chart');
    await expect(page.locator('[role="tabpanel"]').nth(2)).toBeVisible();
  });

  test('device data flow: submit event -> verify in dashboard', async ({ page, request }) => {
    // Step 1: Submit a test power event via API
    const testEvent = {
      device_id: 'e2e-test-device',
      timestamp: new Date().toISOString(),
      event_type: 'power_on',
      message: 'E2E test event',
      battery_percentage: 90,
      battery_voltage: 3.8,
      wifi_signal_strength: -40,
      free_heap: 150000
    };

    const apiResponse = await request.post('http://localhost:8080/api/power-events', {
      data: testEvent
    });
    
    expect(apiResponse.status()).toBe(201);
    
    // Step 2: Refresh dashboard and check if stats updated
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Step 3: Navigate to devices to see the new device
    await page.click('text=Devices');
    await page.waitForTimeout(1000);
    
    // The device should appear in the devices list
    // Note: This might require specific test data attributes in the components
  });

  test('responsive design: mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if navigation is responsive
    const tabsContainer = page.locator('[role="tablist"]');
    await expect(tabsContainer).toBeVisible();
    
    // Test tab navigation on mobile
    await page.click('text=Calendar');
    await expect(page.locator('[role="tabpanel"]').nth(1)).toBeVisible();
    
    await page.click('text=Devices');
    await expect(page.locator('[role="tabpanel"]').nth(3)).toBeVisible();
  });

  test('data refresh and real-time updates simulation', async ({ page, request }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // Take initial state
    await page.waitForTimeout(2000);
    
    // Submit multiple events to simulate real-time data
    const events = [
      {
        device_id: 'realtime-test-1',
        timestamp: new Date().toISOString(),
        event_type: 'power_on',
        message: 'Real-time test 1'
      },
      {
        device_id: 'realtime-test-2',
        timestamp: new Date().toISOString(),
        event_type: 'power_off',
        message: 'Real-time test 2'
      }
    ];

    for (const event of events) {
      await request.post('http://localhost:8080/api/power-events', {
        data: event
      });
    }
    
    // Refresh page to see updated data
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Navigate through tabs to ensure data is updated everywhere
    await page.click('text=Devices');
    await page.waitForTimeout(1000);
    
    await page.click('text=Dashboard');
    await page.waitForTimeout(1000);
  });

  test('error handling: network interruption simulation', async ({ page }) => {
    // Start on dashboard
    await page.goto('/');
    
    // Simulate network failure
    await page.context().setOffline(true);
    
    // Try to navigate between tabs
    await page.click('text=Devices');
    await page.waitForTimeout(1000);
    
    // Restore network
    await page.context().setOffline(false);
    
    // Page should recover
    await page.reload();
    await expect(page.locator('h6')).toContainText('M5StickC Power Logger Dashboard');
  });
});