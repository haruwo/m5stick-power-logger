# M5StickC Plus2 Power Logger

プロフェッショナルレベルの時系列データ監視システム。M5StickC Plus2デバイスからの電源イベントを収集・可視化します。

## 特徴

- **時系列データ収集**: M5StickC Plus2からのリアルタイム電源イベント監視
- **プロフェッショナルなWebインターフェース**: React製の洗練されたダッシュボード
- **カレンダー・タイムライン表示**: 直感的なデータ可視化
- **Docker Compose**: 簡単なデプロイメントと管理
- **データ永続化**: PostgreSQLによる安全なデータ保存
- **RESTful API**: 拡張可能なバックエンドアーキテクチャ

## システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   M5StickC      │───▶│   Backend       │───▶│   PostgreSQL    │
│   Plus2         │    │   (go)          │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## クイックスタート

### 前提条件

- Docker & Docker Compose
- M5StickC Plus2デバイス

### 1. システム起動

```bash
# Docker Composeでシステム起動
docker-compose up -d

# ログの確認
docker-compose logs -f
```

### 2. アクセス

- **フロントエンド**: http://localhost:3001
- **バックエンドAPI**: http://localhost:3000
- **ヘルスチェック**: http://localhost:3000/health

### 3. M5StickCの設定

1. `include/config_local.h`を作成:

```cpp
#ifndef CONFIG_LOCAL_H
#define CONFIG_LOCAL_H

// WiFi設定
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"

// HTTP エンドポイント
#define HTTP_ENDPOINT "http://localhost:3000/api/power-events"

#endif
```

2. デバイスにアップロードしてテスト

## API エンドポイント

### 電源イベント

```http
POST /api/power-events
GET /api/power-events
GET /api/power-events/:id
GET /api/power-events/device/:deviceId/timeline
```

### デバイス管理

```http
GET /api/devices
GET /api/devices/:deviceId
PUT /api/devices/:deviceId
DELETE /api/devices/:deviceId
```

### 分析・統計

```http
GET /api/analytics/summary
GET /api/analytics/calendar/:year/:month
GET /api/analytics/timeline
GET /api/analytics/device/:deviceId/health
```

## APIデータ形式

### 電源イベント POST データ

M5StickC Plus2デバイスから送信されるJSONデータの形式:

```json
{
  "device_id": "m5stick-a1b2c3d4",
  "timestamp": "2024-01-15T10:30:45Z",
  "uptime_ms": 123456,
  "event_type": "power_on",
  "message": "External power connected",
  "battery_percentage": 85,
  "battery_voltage": 4.12,
  "wifi_signal_strength": -45,
  "free_heap": 234567
}
```

#### フィールド説明

| フィールド | 型 | 説明 |
|-----------|---|------|
| `device_id` | string | デバイスの一意識別子 (例: "m5stick-a1b2c3d4") |
| `timestamp` | string | イベント発生時刻 (ISO 8601形式) |
| `uptime_ms` | number | デバイス起動からの経過時間（ミリ秒） |
| `event_type` | string | イベントタイプ: "power_on", "power_off", "battery_low", "system_error" |
| `message` | string | イベントの詳細メッセージ |
| `battery_percentage` | number | バッテリー残量（パーセント） |
| `battery_voltage` | number | バッテリー電圧（ボルト） |
| `wifi_signal_strength` | number | WiFi信号強度（dBm） |
| `free_heap` | number | 利用可能なヒープメモリ（バイト） |

#### イベントタイプ

- `power_on`: 外部電源接続時
- `power_off`: 外部電源切断時  
- `battery_low`: バッテリー残量低下時
- `system_error`: システムエラー発生時

