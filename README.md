# 近隣情報マッピングアプリ - Phase 2: ETL自動化対応版

東京23区の町丁目単位で「学校 × 治安」データを統合・可視化するPoC基盤です。
**Phase 2では台東区・文京区データ追加とApache Airflow ETL自動化を実現しました。**

## 🎯 Phase 2 の新機能（完成！）

### ✅ 実装完了機能（Phase 2）
- **🆕 台東区・文京区データ対応**: 8区、28校、69犯罪データに拡張
- **🤖 Apache Airflow ETL**: 完全自動化されたデータパイプライン
- **📊 データ品質管理**: 自動チェック・異常値検出
- **⚡ 段階的データ拡張**: Priority別の効率的な区展開
- **🔄 安全スコア自動再計算**: 新データ反映時の自動更新
- **📧 ETL完了通知**: 処理結果の自動レポート生成

### 📊 Phase 1 からの継続機能
- **犯罪データ表示**: 各エリアの犯罪情報をマップ上に表示
- **レイヤー切替機能**: 学校・犯罪・安全範囲・ヒートマップの表示制御
- **🔍 高度検索機能**: オートコンプリート + キーボードナビゲーション
- **📁 スマートフィルター**: 折り畳み可能UI + 結果サマリー
- **📈 統計ダッシュボード**: Chart.js、CSV/PDFエクスポート
- **🎯 マーカークラスタリング**: 学校50m、犯罪30m半径での自動グループ化
- **TypeScript対応**: 型安全なフロントエンド開発環境

## 🏗️ Phase 2 アーキテクチャ

### システム構成
```
Apache Airflow ETL (port 8080)
    ↓ 自動データ処理
React + TypeScript + Leaflet Frontend (port 3001)
    ↓ HTTP REST API
Go API Server (port 8081)  
    ↓ SQL queries
PostgreSQL + PostGIS (port 5432)
    ↑ 自動データロード
MinIO S3 (port 9001) ← ETLデータストレージ
```

### 新しいETLフロー
1. **Data Download**: SQLファイル監視・品質チェック
2. **Transform**: 区別データ変換（台東区・文京区）
3. **Normalize**: Parquet形式正規化
4. **Load**: PostGIS自動ロード
5. **Recalc**: 安全スコア再計算
6. **Notify**: 完了通知・レポート生成

## 🚀 Phase 2 起動方法

### 🔥 クイックスタート（推奨）
```bash
# フル環境起動（アプリ + Airflow ETL）
make full-start

# 台東区・文京区データ追加
make add-data

# ETL実行
make etl-run
```

### 📊 個別サービス起動

#### 1. アプリケーション環境起動
```bash
# データベース + API + フロントエンド
make start
```

#### 2. Airflow ETL環境起動
```bash
# Airflow + 関連サービス
make airflow-start
```

#### 3. 台東区・文京区データ追加（初回のみ）
```bash
# PostgreSQLに新データ投入
make db-shell
\i /docker-entrypoint-initdb.d/../sql/districts/taito_bunkyo_data.sql
\q

# または自動実行
make add-data
```

#### 4. ETL実行確認
```bash
# DAG状態確認
make airflow-status

# ETL実行（手動トリガー）
make airflow-trigger

# Airflowログ確認
make airflow-logs
```

## 📍 Phase 2 アクセス先

- **フロントエンド**: http://localhost:3001
- **🆕 Airflow Web UI**: http://localhost:8080 (admin/admin)
- **API Health Check**: http://localhost:8081/health
- **PostgreSQL**: localhost:5432 (postgres/password)
- **MinIO Console**: http://localhost:9001 (minio/minio123)

## 🎮 Phase 2 使用方法

### 新しいエリア操作
1. **エリア選択**: サイドバーから以下を選択可能
   - 千代田区丸の内（既存）
   - 中央区銀座（既存）  
   - 世田谷区・新宿区・渋谷区・港区（Phase 1で追加）
   - **🆕 台東区浅草・上野・浅草橋・蔵前**
   - **🆕 文京区本郷・湯島・千駄木・根津**

2. **レイヤー制御**: 
   - 「学校」「犯罪」「安全範囲」「🌡️ヒートマップ」

3. **🔍 高度検索**: 
   - リアルタイムオートコンプリート
   - キーボードナビゲーション（↑↓Enter）
   - 検索候補ハイライト表示

4. **📊 統計ダッシュボード**: 
   - 犯罪種別分布チャート
   - 安全スコア分布
   - CSV/PDFエクスポート

### 🤖 ETL自動化操作
1. **Airflow Web UI**: http://localhost:8080 でDAG監視
2. **手動実行**: `make airflow-trigger` または Web UIから
3. **スケジュール**: 毎日定時実行（現在は手動推奨）
4. **ログ確認**: `make airflow-logs` で処理状況確認

## 📊 Phase 2 データ規模

| 指標 | Phase 1 | Phase 2 | 増加 |
|------|---------|---------|------|
| **対応区数** | 6区 | 8区 | +2区 |
| **学校数** | 20校 | 28校 | +8校 |
| **犯罪データ** | 44件 | 69件 | +25件 |
| **エリア数** | 12箇所 | 20箇所 | +8箇所 |

### 新規追加エリア詳細
- **台東区**: 浅草（観光地）、上野（文化施設）、浅草橋（問屋街）、蔵前（伝統工芸）
- **文京区**: 本郷（大学街）、湯島（神社文化）、千駄木（住宅街）、根津（下町）

## 🎯 安全性スコア算出方法（改良版）

**計算式**: `Score = max(0, 100 - crime_count * 10)`
- 学校から半径500m以内の犯罪件数を集計
- 0件=100点, 1件=90点, 2件=80点, ... 10件以上=0点
- **🆕 自動再計算**: 新データ追加時にETLで自動更新

**レベル判定**:
- 90-100点: 非常に安全 (very_safe) - 濃緑
- 70-89点: 安全 (safe) - 緑
- 50-69点: 注意 (moderate) - オレンジ  
- 0-49点: 警戒 (caution) - 赤

## 🔧 Phase 2 技術スタック

### 新規追加技術
- **ETL**: Apache Airflow 2.7.0 + LocalExecutor
- **データストレージ**: MinIO S3互換 + Parquet形式
- **自動化**: Docker Compose オーケストレーション
- **監視**: Airflow Web UI + ログ管理

### 継続使用技術
- **Backend**: Go + Gorilla Mux + PostgreSQL/PostGIS
- **Frontend**: React 18 + TypeScript 5.2 + Leaflet
- **Database**: PostgreSQL 15 + PostGIS 3.3
- **Infrastructure**: Docker Compose

## 📈 Phase 3 計画（今後の予定）

### 3.1 データ拡張（優先度：高）
- [ ] **残り15区追加**: 墨田区、江東区、品川区、目黒区、大田区...
- [ ] **実データソース統合**: 文科省API、警視庁オープンデータAPI
- [ ] **リアルタイムデータ**: Flink/Spark Streaming

### 3.2 高度機能（優先度：中）
- [ ] **実GeoJSON境界**: 23区正確な行政区域表示
- [ ] **ルート検索**: 安全な通学路提案
- [ ] **予測分析**: 機械学習による犯罪発生予測
- [ ] **時系列可視化**: アニメーション表示

### 3.3 クラウド展開（優先度：低）
- [ ] **AWS EKS移行**: Kubernetes + Helm
- [ ] **RDS PostgreSQL**: 高可用性クラスタ
- [ ] **CI/CD**: GitHub Actions自動デプロイ

## 🐛 Phase 2 トラブルシューティング

### Airflow関連
```bash
# Airflowサービス確認
make airflow-status

# Airflow再起動
make airflow-stop && make airflow-start

# DAGが表示されない場合
make airflow-shell
airflow dags list
```

### データベース接続エラー
```bash
# PostgreSQLサービス確認
make status

# 必要に応じて再起動
make restart

# 新データ確認
make db-shell
SELECT COUNT(*) FROM areas WHERE ward_code IN ('13106', '13105');
```

### ポート衝突対処
- **Airflow**: ポート8080が使用中の場合、docker-compose.airflow.yml修正
- **フロントエンド**: start_frontend.shが自動でポート探索
- **API**: 8081ポート衝突時は他のサービス停止

## 📝 Phase 2 開発メモ

### 達成した設計目標
✅ **段階的実装**: Phase 1 → Phase 2の順序立てた拡張  
✅ **ETL自動化**: Airflowベースの本格パイプライン  
✅ **データ品質管理**: 自動チェック・異常値検出  
✅ **スケーラブル設計**: 残り21区への展開準備完了  
✅ **運用監視**: Web UI + ログ管理の充実  

### 技術的改善点
- LocalExecutor使用でシンプル構成を維持
- XCom活用でタスク間データ連携を実現
- PostgresHook使用でデータベース操作を安全化
- Docker ネットワーク分離でセキュリティ向上

---

## 🎯 現在の状況まとめ

**Phase 2 目標**: ✅ **完全達成**
- 台東区・文京区データ追加: **完了**
- Apache Airflow ETL構築: **完了**
- 自動化パイプライン: **完了**

**次のマイルストーン**: Phase 3（残り15区データ拡張）

**🔥 推奨次アクション**: 
1. `make phase2-start` でフル環境起動
2. `make airflow-trigger` でETL実行
3. http://localhost:3001 で台東区・文京区データ確認

---

**📅 最終更新**: 2025-08-24  
**🚀 システム状態**: Phase 2 完成・稼働中  
**🎯 次のマイルストーン**: Phase 3（墨田区・江東区・品川区・目黒区追加）  
**⭐ 技術レベル**: 本格運用可能なETL基盤完成
