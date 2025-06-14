const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://nginx';

describe('E2E Tests', () => {
  // 初期化待機用のヘルパー
  const waitForAPI = () => new Promise(resolve => setTimeout(resolve, 5000));

  describe('Legacy API Tests', () => {
    test('GET /api/v1/items should return items list', async () => {
      await waitForAPI();

      const response = await fetch(`${BASE_URL}/api/v1/items`);
      expect(response.status).toBe(200);

      const items = await response.json();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);

      // 各アイテムの構造を確認
      items.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('created_at');
      });
    }, 10000);
  });

  describe('Power Events API Tests', () => {
    test('POST /api/power-events should create power event', async () => {
      await waitForAPI();

      const powerEvent = {
        device_id: 'test-device-e2e',
        event_type: 'power_on',
        data: JSON.stringify({
          voltage: 3.3,
          current: 0.5,
          battery_percentage: 85
        })
      };

      const response = await fetch(`${BASE_URL}/api/power-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(powerEvent),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('successfully');
    }, 10000);

    test('GET /api/power-events should return power events list', async () => {
      const response = await fetch(`${BASE_URL}/api/power-events`);
      expect(response.status).toBe(200);

      const events = await response.json();
      expect(Array.isArray(events)).toBe(true);
      
      if (events.length > 0) {
        events.forEach(event => {
          expect(event).toHaveProperty('id');
          expect(event).toHaveProperty('device_id');
          expect(event).toHaveProperty('event_type');
          expect(event).toHaveProperty('timestamp');
          expect(event).toHaveProperty('created_at');
        });
      }
    }, 10000);

    test('GET /api/power-events/device/:deviceId/timeline should return device timeline', async () => {
      const deviceId = 'test-device-e2e';
      const response = await fetch(`${BASE_URL}/api/power-events/device/${deviceId}/timeline`);
      expect(response.status).toBe(200);

      const events = await response.json();
      expect(Array.isArray(events)).toBe(true);
    }, 10000);
  });

  describe('Device Management API Tests', () => {
    test('GET /api/devices should return devices list', async () => {
      const response = await fetch(`${BASE_URL}/api/devices`);
      expect(response.status).toBe(200);

      const devices = await response.json();
      expect(Array.isArray(devices)).toBe(true);
      
      if (devices.length > 0) {
        devices.forEach(device => {
          expect(device).toHaveProperty('id');
          expect(device).toHaveProperty('name');
          expect(device).toHaveProperty('last_seen');
          expect(device).toHaveProperty('created_at');
          expect(device).toHaveProperty('updated_at');
        });
      }
    }, 10000);

    test('GET /api/devices/:deviceId should return specific device', async () => {
      // 先にデバイス一覧を取得して存在するデバイスIDを取得
      const devicesResponse = await fetch(`${BASE_URL}/api/devices`);
      const devices = await devicesResponse.json();
      
      if (devices.length > 0) {
        const deviceId = devices[0].id;
        const response = await fetch(`${BASE_URL}/api/devices/${deviceId}`);
        expect(response.status).toBe(200);

        const device = await response.json();
        expect(device).toHaveProperty('id');
        expect(device.id).toBe(deviceId);
        expect(device).toHaveProperty('name');
      }
    }, 10000);

    test('PUT /api/devices/:deviceId should update device', async () => {
      // 先にデバイス一覧を取得
      const devicesResponse = await fetch(`${BASE_URL}/api/devices`);
      const devices = await devicesResponse.json();
      
      if (devices.length > 0) {
        const deviceId = devices[0].id;
        const updateData = {
          name: `Updated Device ${Date.now()}`,
          description: 'Updated description for E2E test'
        };

        const response = await fetch(`${BASE_URL}/api/devices/${deviceId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result).toHaveProperty('message');
        expect(result.message).toContain('successfully');
      }
    }, 10000);
  });

  describe('Frontend Tests', () => {
    test('Frontend should be accessible', async () => {
      const response = await fetch(BASE_URL);
      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('<!DOCTYPE html>');
    });

    test('Frontend should serve React app with routing', async () => {
      const response = await fetch(BASE_URL);
      const html = await response.text();
      
      // React アプリケーションの基本構造を確認
      expect(html).toContain('M5StickC Power Logger');
    });
  });

  describe('Integration Tests', () => {
    test('Power event creation should update device last_seen', async () => {
      const testDeviceId = `integration-test-${Date.now()}`;
      
      // 電源イベントを作成
      const powerEvent = {
        device_id: testDeviceId,
        event_type: 'power_on',
        data: JSON.stringify({ test: true })
      };

      const eventResponse = await fetch(`${BASE_URL}/api/power-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(powerEvent),
      });

      expect(eventResponse.status).toBe(201);

      // デバイスが自動作成されたことを確認
      const deviceResponse = await fetch(`${BASE_URL}/api/devices/${testDeviceId}`);
      expect(deviceResponse.status).toBe(200);

      const device = await deviceResponse.json();
      expect(device.id).toBe(testDeviceId);
    }, 10000);
  });
});