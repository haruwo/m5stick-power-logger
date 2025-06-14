const { test, expect } = require('@playwright/test');

test.describe('API Endpoints', () => {
  const apiBaseUrl = 'http://localhost:8080/api';

  test('should handle power event submission', async ({ request }) => {
    const powerEvent = {
      device_id: 'test-device-001',
      timestamp: new Date().toISOString(),
      event_type: 'power_on',
      message: 'Device started successfully',
      battery_percentage: 85,
      battery_voltage: 3.7,
      wifi_signal_strength: -45,
      free_heap: 125000
    };

    const response = await request.post(`${apiBaseUrl}/power-events`, {
      data: powerEvent
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.event_id).toBeDefined();
  });

  test('should validate power event data', async ({ request }) => {
    const invalidEvent = {
      device_id: '',
      timestamp: 'invalid-date',
      event_type: 'invalid_type'
    };

    const response = await request.post(`${apiBaseUrl}/power-events`, {
      data: invalidEvent
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  test('should fetch devices list', async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/devices`);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.devices).toBeDefined();
    expect(body.count).toBeDefined();
    expect(Array.isArray(body.devices)).toBe(true);
  });

  test('should fetch power events with pagination', async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/power-events?page=1&limit=10`);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.events).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(10);
  });

  test('should filter power events by device_id', async ({ request }) => {
    // First create a test event
    await request.post(`${apiBaseUrl}/power-events`, {
      data: {
        device_id: 'filter-test-device',
        timestamp: new Date().toISOString(),
        event_type: 'power_on',
        message: 'Test event for filtering'
      }
    });

    const response = await request.get(`${apiBaseUrl}/power-events?device_id=filter-test-device`);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.events).toBeDefined();
    
    // All events should be from the specified device
    body.events.forEach(event => {
      expect(event.device_id).toBe('filter-test-device');
    });
  });

  test('should fetch dashboard stats', async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/dashboard/stats`);
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.total_devices).toBeDefined();
    expect(body.events_24h).toBeDefined();
    expect(body.active_sessions).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  test('should handle CORS preflight requests', async ({ request }) => {
    const response = await request.fetch(`${apiBaseUrl}/power-events`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    expect(response.status()).toBe(204);
    expect(response.headers()['access-control-allow-origin']).toBe('*');
    expect(response.headers()['access-control-allow-methods']).toContain('POST');
  });
});