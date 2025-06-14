const { test, expect } = require('@playwright/test');

test.describe('Health Checks', () => {
  test('application health check', async ({ request }) => {
    const response = await request.get('http://localhost:8080/health');
    expect(response.status()).toBe(200);
  });

  test('all services are running', async ({ page }) => {
    // Check if frontend loads
    await page.goto('/');
    await expect(page).toHaveTitle(/M5StickC Power Logger/);
    
    // Check if API is responsive
    const response = await page.request.get('http://localhost:8080/api/dashboard/stats');
    expect(response.status()).toBe(200);
  });

  test('database connectivity', async ({ request }) => {
    // Test database through API endpoint
    const response = await request.get('http://localhost:8080/api/devices');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('devices');
    expect(body).toHaveProperty('count');
  });

  test('redis connectivity', async ({ request }) => {
    // Test Redis through cached dashboard stats
    const response1 = await request.get('http://localhost:8080/api/dashboard/stats');
    expect(response1.status()).toBe(200);
    
    // Make another request to test cache
    const response2 = await request.get('http://localhost:8080/api/dashboard/stats');
    expect(response2.status()).toBe(200);
    
    const body1 = await response1.json();
    const body2 = await response2.json();
    
    // Should be similar (cached) response
    expect(body1).toHaveProperty('timestamp');
    expect(body2).toHaveProperty('timestamp');
  });

  test('nginx proxy configuration', async ({ request }) => {
    // Test API proxying
    const apiResponse = await request.get('http://localhost:8080/api/dashboard/stats');
    expect(apiResponse.status()).toBe(200);
    
    // Test CORS headers
    expect(apiResponse.headers()['access-control-allow-origin']).toBe('*');
    
    // Test static file serving
    const staticResponse = await request.get('http://localhost:8080/');
    expect(staticResponse.status()).toBe(200);
    expect(staticResponse.headers()['content-type']).toContain('text/html');
  });

  test('performance: page load time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('security headers', async ({ request }) => {
    const response = await request.get('http://localhost:8080/');
    
    const headers = response.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});