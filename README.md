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

