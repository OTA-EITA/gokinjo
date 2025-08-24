# 近隣情報マッピングアプリ - Phase 1: 拡張デモ版

東京23区の町丁目単位で「学校 × 治安」データを統合・可視化するPoC基盤です。

## 🎯 Phase 1 の新機能

### ✅ 実装完了機能
- **犯罪データ表示**: 各エリアの犯罪情報をマップ上に表示
- **レイヤー切替機能**: 学校・犯罪・安全範囲の表示/非表示制御
- **安全性スコア**: 学校周辺500m圏内の犯罪密度に基づく安全度算出
- **インタラクティブマップ**: アイコン色分けとポップアップ情報
- **TypeScript対応**: 型安全なフロントエンド開発環境

### 📊 API エンドポイント
- `GET /health` - サーバー状態確認
- `GET /v1/areas` - エリア一覧
- `GET /v1/areas/{ward_code}/{town_code}/schools` - 学校データ
- `GET /v1/areas/{ward_code}/{town_code}/crimes` - 犯罪データ（新規）
- `GET /v1/schools/{id}/safety-score` - 個別学校安全スコア（新規）
- `GET /v1/areas/{ward_code}/{town_code}/safety-scores` - エリア全体安全スコア（新規）

## 🚀 起動方法

### 1. データベース起動
```bash
cd deployment
docker-compose up -d
```

### 2. 追加サンプルデータ投入（初回のみ）
```bash
# PostgreSQLに接続
make db-shell

# サンプル犯罪データを追加
\i /docker-entrypoint-initdb.d/add_sample_crimes.sql
\q
```

### 3. APIサーバー起動
```bash
cd api
DATABASE_URL="postgres://postgres:password@localhost:5432/neighborhood_mapping?sslmode=disable" go run ./cmd/simple-server
```

### 4. フロントエンド起動
```bash
# 実行権限を追加（初回のみ）
chmod +x start_frontend.sh

# フロントエンド起動
./start_frontend.sh
```

## 📍 アクセス先

- **フロントエンド**: http://localhost:3001 (またはstart_frontend.shが表示するポート)
- **API Health Check**: http://localhost:8081/health
- **PostgreSQL**: localhost:5432 (postgres/password)
- **MinIO Console**: http://localhost:9001 (minio/minio123)

## 🎮 使用方法

1. **エリア選択**: サイドバーから千代田区丸の内または中央区銀座を選択
2. **レイヤー制御**: 
   - 「学校」チェックボックス：学校マーカーの表示/非表示
   - 「犯罪」チェックボックス：犯罪マーカーの表示/非表示  
   - 「安全範囲」チェックボックス：学校周辺500m圏の安全度可視化
3. **マーカークリック**: 各マーカーをクリックして詳細情報を表示

### TypeScript開発モード（オプション）
```bash
cd frontend
npm install          # 型チェック用依存関係をインストール
npm run type-check   # TypeScript型チェック実行
npm run watch        # ファイル変更の監視と自動型チェック
```

## 🏗️ アーキテクチャ

### 現在の構成（Phase 1）
```
React + TypeScript + Leaflet Frontend (port 3001)
    ↓ HTTP REST API
Go API Server (port 8081)  
    ↓ SQL queries
PostgreSQL + PostGIS (port 5432)
```

### データフロー
- **手動サンプルデータ**: SQLスクリプトによる初期データ投入
- **リアルタイム**: API経由でのデータ取得と表示
- **インメモリ処理**: 安全性スコア計算

## 📊 安全性スコア算出方法

**計算式**: `Score = max(0, 100 - crime_count * 10)`
- 学校から半径500m以内の犯罪件数を集計
- 0件=100点, 1件=90点, 2件=80点, ... 10件以上=0点

**レベル判定**:
- 90-100点: 非常に安全 (very_safe) - 濃緑
- 70-89点: 安全 (safe) - 緑
- 50-69点: 注意 (moderate) - オレンジ  
- 0-49点: 警戒 (caution) - 赤

## 🔧 技術スタック

- **Backend**: Go + Gorilla Mux + PostgreSQL/PostGIS
- **Frontend**: React 18 + TypeScript 5.2 + Leaflet
- **Database**: PostgreSQL 15 + PostGIS 3.3
- **Storage**: MinIO (S3互換、将来のETL用)
- **Infrastructure**: Docker Compose

## 📈 Phase 2 計画

Phase 1 完了後、以下を検討：
- Apache Airflow によるETL自動化
- 実際のオープンデータAPI連携  
- 23区全体への拡張
- gRPC API移行
- クラウドデプロイ (ECS/EKS)

## 🐛 トラブルシューティング

### データベース接続エラー
```bash
# PostgreSQLサービス確認
make status
# 必要に応じて再起動
make restart
```

### ポート衝突
- APIサーバー: ポート8081が使用中の場合、他のサービスを停止
- フロントエンド: start_frontend.shが自動で利用可能ポートを探索

### データが表示されない
```sql
-- データ確認クエリ
SELECT COUNT(*) FROM areas;    -- 2件あるはず
SELECT COUNT(*) FROM schools;  -- 2件あるはず  
SELECT COUNT(*) FROM crimes;   -- 16件あるはず（サンプルデータ投入後）
```

## 📝 開発メモ

現在のPhase 1実装では、Airflowを使わずシンプルな構成で完全な機能デモを実現しています。
- 設計書の段階的実装アプローチに従い、まずコア機能の安定化を優先
- 必要に応じてPhase 2でデータフロー自動化を追加可能な構成

---

**🎯 Phase 1目標**: デモ重視の完全動作環境 ✅  
**📅 更新日**: 2025-08-24