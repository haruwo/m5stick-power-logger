const { test, expect } = require('@playwright/test');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

test.describe('API Endpoints', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL.replace('/api', '')}/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
  });

  test('should get devices list', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/devices`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should create a new device', async ({ request }) => {
    const deviceData = {
      name: 'E2E Test Device',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      location: 'Test Location'
    };

    const response = await request.post(`${API_BASE_URL}/devices`, {
      data: deviceData
    });
    
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name', deviceData.name);
    expect(data).toHaveProperty('macAddress', deviceData.macAddress);
  });

  test('should get power events', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/power-events`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should create power event', async ({ request }) => {
    const eventData = {
      deviceId: 1,
      eventType: 'power_on',
      voltage: 3.3,
      current: 0.5,
      power: 1.65,
      batteryLevel: 85
    };

    const response = await request.post(`${API_BASE_URL}/power-events`, {
      data: eventData
    });
    
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('eventType', eventData.eventType);
  });

  test('should get analytics data', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/analytics/summary`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('totalDevices');
    expect(data).toHaveProperty('activeDevices');
    expect(data).toHaveProperty('totalEvents');
  });

  test('should handle invalid device creation', async ({ request }) => {
    const invalidData = {
      name: '',
      macAddress: 'invalid-mac'
    };

    const response = await request.post(`${API_BASE_URL}/devices`, {
      data: invalidData
    });
    
    expect(response.status()).toBe(400);
  });

  test('should handle non-existent endpoints', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/non-existent`);
    expect(response.status()).toBe(404);
  });
});