# M5StickC Power Logger Server

電力ログデータを管理するためのWebアプリケーションサーバーです。

## アーキテクチャ

- **Backend**: Go (Gin framework)
- **Frontend**: React (Vite)
- **Database**: PostgreSQL
- **Reverse Proxy**: Nginx
- **Container**: Docker Compose

## 起動方法

### Docker Compose を使用した起動

1. 環境変数ファイルを作成:
```bash
cp .env.example .env
# .env ファイルを編集してデータベース設定を記入
```

2. すべてのサービスを起動:
```bash
docker compose up -d
```

3. アプリケーションにアクセス:
- Frontend: http://localhost (デフォルトポート80、NGINX_PORTで変更可能)
- Backend API: http://localhost/api/v1/items

4. サービスを停止:
```bash
docker compose down
```

### 開発環境での起動

#### Backend (Go)
```bash
cd backend
go mod tidy
go run main.go
```

#### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## テスト実行方法

### Backend テスト
```bash
cd backend
go test ./...
```

### Frontend テスト
フロントエンドにはテストスクリプトが設定されていません。

### E2E テスト
Docker Compose でサービスを起動してからE2Eテストを実行:

```bash
# サービスを起動
docker compose up -d

# E2Eテストを実行
docker compose --profile test up e2e --build
```

## API エンドポイント

### GET /api/v1/items
電力ログアイテムの一覧を取得

**レスポンス例:**
```json
[
  {
    "id": 1,
    "name": "Item 1",
    "description": "Description 1",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

## データベース

PostgreSQL を使用。初期化スクリプトは `db/init.sql` に定義されています。

## 開発

### ディレクトリ構成
```
server/
├── backend/           # Go バックエンド
│   ├── handlers/      # HTTPハンドラー
│   ├── models/        # データモデル
│   ├── db/            # データベース接続
│   └── main.go        # エントリーポイント
├── frontend/          # React フロントエンド
│   └── src/
├── e2e/               # E2Eテスト
├── nginx/             # Nginx設定
├── db/                # データベース初期化
└── compose.yml        # Docker Compose設定
```

### 環境変数

以下の環境変数が必要です:

- `DB_USER`: データベースユーザー名
- `DB_PASSWORD`: データベースパスワード
- `DB_NAME`: データベース名
- `NGINX_PORT`: Nginxのポート番号 (デフォルト: 80)

**ポート変更例:**
```bash
# ポート8080で起動
NGINX_PORT=8080 docker compose up -d

# または.envファイルで設定
echo "NGINX_PORT=8080" >> .env
docker compose up -d
```