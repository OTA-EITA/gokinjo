# 整理後のプロジェクト構成

## 稼働中のコンポーネント

### データベース
- `deployment/docker-compose-minimal.yml` - PostgreSQL + PostGIS + MinIO
- `deployment/sql/init.sql` - データベース初期化スクリプト

### APIサーバー (Go)
- `api/cmd/simple-server/main.go` - メインのHTTP APIサーバー
- `api/go.mod` - Go依存関係
- `api/proto/neighborhood_mapping.proto` - 将来のgRPC用プロトコル定義

### フロントエンド (React + Leaflet)
- `frontend/public/index.html` - メインHTML
- `frontend/public/src/app.js` - Reactアプリケーション
- `start_frontend.sh` - フロントエンド起動スクリプト

### データ
- `data/raw/` - 生データ（.gitkeepのみ）
- `data/processed/` - 処理済みデータ（.gitkeepのみ）  
- `data/curated/` - 統合データ（.gitkeepのみ）

## 削除されたファイル

### Python関連
- `api/requirements.txt`
- `api/server.py`

### gRPC生成ファイル
- `api/neighborhood_mapping*.pb.go`
- `api/swagger/`
- `api/third_party/`

### 未使用スクリプト
- 各種テスト・セットアップスクリプト
- `etl/` ディレクトリ（Airflow DAG）

### フロントエンド設定
- `frontend/Dockerfile`
- `frontend/package.json`

## 起動手順

1. データベース起動:
```bash
cd deployment
docker-compose -f docker-compose-minimal.yml up -d
```

2. APIサーバー起動:
```bash
cd api
DATABASE_URL="postgres://postgres:password@localhost:5432/neighborhood_mapping?sslmode=disable" go run ./cmd/simple-server
```

3. フロントエンド起動:
```bash
bash start_frontend.sh
```

4. ブラウザアクセス:
- フロントエンド: http://localhost:3001 (またはスクリプトが表示するポート)
- API: http://localhost:8081
