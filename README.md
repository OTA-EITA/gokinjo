# 近隣情報マッピングアプリ - PoC データ基盤

東京23区の町丁目単位で「学校 × 治安」データを統合・可視化するPoC基盤です。

## 🎯 プロジェクト概要

このプロジェクトは以下を目的としています：
- 東京23区の犯罪データと学校データを統合
- 町丁目レベルでの安全性スコア算出
- 地図上でのインタラクティブな可視化
- 将来的な全国展開を見据えたスケーラブルなアーキテクチャ

## 🏗️ アーキテクチャ

### データフロー
```
Raw Data (Excel/CSV/GeoJSON) 
    ↓ (Airflow ETL)
S3 Staging (Parquet)
    ↓ (Data Normalization)
PostGIS Database
    ↓ (gRPC API)
React + Leaflet Frontend
```

### 技術スタック
- **オーケストレーション**: Apache Airflow (KubernetesExecutor)
- **データベース**: PostgreSQL + PostGIS
- **API**: gRPC
- **フロントエンド**: React + Leaflet
- **インフラ**: Docker Compose (開発) → AWS EKS (本番)

## 📁 プロジェクト構造

```
neighborhood-mapping-poc/
├── docs/                   # プロジェクトドキュメント
├── etl/                    # Airflow DAGs とETL処理
├── api/                    # gRPC API サーバー
├── frontend/               # React フロントエンド
├── deployment/             # Docker Compose, Kubernetes manifests
└── data/                   # データファイル
    ├── raw/                # 生データ
    ├── processed/          # 変換済みデータ
    └── curated/            # 統合・正規化済みデータ
```

## 🚀 開発フェーズ

### Phase 1: ローカル開発環境
- Docker Compose での快速プロトタイピング
- MinIO (S3互換) + PostGIS + Airflow LocalExecutor

### Phase 2: クラウド PoC
- AWS ECS Fargate + RDS(PostGIS) + S3
- リアルなインフラでのデモ

### Phase 3: プロダクション対応
- AWS EKS + Airflow KubernetesExecutor
- スケーラブルな全国対応基盤

## 📊 データスキーマ

### areas (町丁目エリア)
- id: serial
- ward_code: text (区コード)
- town_code: text (町丁目コード)
- name: text (エリア名)
- geom: polygon (地理情報)

### schools (学校)
- id: serial
- name: text (学校名)
- type: enum [elementary, junior_high, high]
- public_private: enum [public, private]
- location: point (位置情報)
- area_id: foreign key

### crimes (犯罪)
- id: serial
- category: text (犯罪種別)
- date: date (発生日)
- location: point (発生場所)
- area_id: foreign key

## 🔮 将来拡張計画

- Apache Spark + Sedona による全国規模バッチETL
- Apache Flink によるリアルタイムストリーミング処理
- 不動産・人口・ユーザー生成データ追加
- サービスメッシュ (Istio/Linkerd) 導入

## 📝 ドキュメント

詳細な設計書は `docs/architecture.yaml` を参照してください。
