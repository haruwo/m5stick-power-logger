const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://nginx';

describe('E2E Tests', () => {
  test('GET /api/v1/items should return items list', async () => {
    // APIが起動するまで待機
    await new Promise(resolve => setTimeout(resolve, 5000));

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
  });

  test('Frontend should be accessible', async () => {
    const response = await fetch(BASE_URL);
    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
  });
});