# M5StickC Plus2 Power Logger Backend

プロフェッショナルなIoTデータ管理システム - M5StickC Plus2からの電源イベントデータを受信、永続化、可視化

## システム構成

### アーキテクチャ概要
```
M5StickC Plus2 → Nginx → Backend API → PostgreSQL
                   ↓
              Frontend Dashboard
                   ↓
                Redis Cache
```

### サービス構成
- **PostgreSQL**: 時系列データの永続化、JSONB対応
- **Redis**: キャッシュレイヤー、セッション管理
- **Backend API**: Node.js/Express RESTful API
- **Frontend**: React SPA (カレンダー・ガントチャート表示)
- **Nginx**: リバースプロキシ、ロードバランサー

## クイックスタート

### 前提条件
- Docker & Docker Compose
- Git
- 16GB以上のディスク容量

### デプロイ手順

1. **プロジェクトクローン**
```bash
git clone <repository-url>
cd m5stick-power-logger-backend
```

2. **環境設定**
```bash
cp .env.example .env
# .envファイルを編集して環境に合わせて設定
```

3. **起動**
```bash
# バックグラウンドで全サービス起動
docker-compose up -d

# ログ確認
docker-compose logs -f
```

4. **動作確認**
```bash
# ヘルスチェック
curl http://localhost:8080/health

# ダッシュボードアクセス
open http://localhost:8080
```

## API エンドポイント

### データ送信 (M5StickC用)
```http
POST /api/power-events
Content-Type: application/json
X-Device-ID: M5S2_12345678

{
  "device_id": "M5S2_12345678",
  "timestamp": "2025-06-13T12:34:56Z",
  "uptime_ms": 123456,
  "event_type": "power_on",
  "message": "External power connected",
  "battery_percentage": 85,
  "battery_voltage": 4.12,
  "wifi_signal_strength": -45,
  "free_heap": 245760
}
```

### データ取得 (フロントエンド用)
```http
# イベント一覧
GET /api/power-events?device_id=M5S2_12345678&start_date=2025-06-01

# 電源セッション (ガントチャート用)
GET /api/power-sessions?device_id=M5S2_12345678

# 日次サマリー (カレンダー用)
GET /api/daily-summary?start_date=2025-06-01&end_date=2025-06-30

# デバイス一覧
GET /api/devices

# ダッシュボード統計
GET /api/dashboard/stats
```

## データベーススキーマ

### 主要テーブル

**power_events** (時系列データ)
- イベントの詳細記録
- インデックス最適化済み
- JSONB対応メタデータ

**power_sessions** (セッション管理)
- 電源ON/OFF期間の管理
- ガントチャート表示用
- 自動トリガー更新

**devices** (デバイス管理)
- デバイス登録・管理
- 統計情報付きビュー

### パフォーマンス最適化
- 複合インデックス
- パーティショニング対応設計
- 統計ビューによる高速集計

## フロントエンド機能

### カレンダー表示
- 日別イベント数表示
- 色分けによる状態識別
- ドリルダウンナビゲーション

### ガントチャート
- 電源セッション期間表示
- デバイス別タイムライン
- インタラクティブなズーム

### リアルタイムダッシュボード
- デバイス状態監視
- アラート表示
- 統計サマリー

## 運用・監視

### ログ管理
```bash
# アプリケーションログ
docker-compose logs backend

# データベースログ
docker-compose logs postgres

# Nginxアクセスログ
docker-compose logs nginx
```

### バックアップ
```bash
# データベースバックアップ
docker-compose exec postgres pg_dump -U power_user power_logger > backup.sql

# データボリューム確認
docker volume ls | grep m5stick
```

### スケーリング
```bash
# バックエンドサービススケール
docker-compose up -d --scale backend=3

# リソース使用量確認
docker stats
```

## セキュリティ

### 実装済み対策
- Helmet.js による HTTP セキュリティ
- CORS 制御
- レート制限
- 入力値検証
- SQL インジェクション対策

### 本番環境推奨設定
- HTTPS証明書設定
- ファイアウォール設定
- 定期的なセキュリティ更新
- 監査ログの有効化

## カスタマイズ

### 環境変数
```env
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://:pass@host:port
JWT_SECRET=your_secret_key
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### データ保持期間設定
```sql
-- 古いデータの自動削除設定
CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS void AS $$
BEGIN
    DELETE FROM power_events 
    WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;
```

## トラブルシューティング

### よくある問題

**コンテナが起動しない**
```bash
docker-compose logs <service_name>
docker system prune -f
```

**データベース接続エラー**
```bash
docker-compose exec postgres pg_isready -U power_user
```

**メモリ不足**
```bash
# リソース制限追加
echo "services:
  postgres:
    mem_limit: 1g" >> docker-compose.override.yml
```

## パフォーマンス

### 想定負荷
- 100デバイス同時接続
- 1分間に1000イベント処理
- 1年間のデータ保持

### 最適化項目
- PostgreSQL設定チューニング
- Redis メモリ最適化
- Nginx キャッシュ設定
- アプリケーション接続プール

## ライセンス

MIT License

## サポート

本番環境での使用や技術サポートについては、開発チームまでお問い合わせください。