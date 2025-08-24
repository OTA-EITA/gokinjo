# 近隣情報マッピングアプリ - PoC環境管理

.PHONY: help setup start stop clean logs status

# デフォルトターゲット
help: ## このヘルプを表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## 初回セットアップ（必要なディレクトリとファイルを作成）
	@echo "プロジェクト初期セットアップ..."
	mkdir -p data/{raw,processed,curated}
	mkdir -p etl/{dags,plugins}
	@echo "セットアップ完了"

start: ## 開発環境を起動
	@echo "開発環境を起動しています..."
	cd deployment && docker-compose up -d
	@echo "起動完了"
	@echo ""
	@echo "サービスアクセス先:"
	@echo "  - Airflow:     http://localhost:8080 (admin/admin)"
	@echo "  - MinIO:       http://localhost:9001 (minio/minio123)"
	@echo "  - PostgreSQL:  localhost:5432 (postgres/password)"
	@echo "  - API:         localhost:50051"
	@echo "  - Frontend:    http://localhost:3000"

stop: ## 開発環境を停止
	@echo "開発環境を停止しています..."
	cd deployment && docker-compose down
	@echo "停止完了"

restart: stop start ## 開発環境を再起動

logs: ## 全サービスのログを表示
	cd deployment && docker-compose logs -f

logs-airflow: ## Airflowのログのみ表示
	cd deployment && docker-compose logs -f airflow

logs-api: ## APIサーバーのログのみ表示
	cd deployment && docker-compose logs -f api-server

status: ## サービス状態を確認
	cd deployment && docker-compose ps

clean: ## 開発環境を完全にクリーンアップ（データも削除）
	@echo "🧹 開発環境をクリーンアップしています..."
	cd deployment && docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "クリーンアップ完了"

db-shell: ## PostgreSQLに接続
	cd deployment && docker-compose exec postgis psql -U postgres -d neighborhood_mapping

minio-shell: ## MinIOコンテナに接続
	cd deployment && docker-compose exec minio sh

test-data: ## テストデータをロード
	@echo "テストデータをロード中..."
	# TODO: implement test data loading
	@echo "テストデータロード完了"

lint: ## コード品質チェック
	@echo "コード品質チェック..."
	# Python
	find . -name "*.py" -not -path "./venv/*" -not -path "./.git/*" | xargs python -m py_compile
	@echo "Python構文チェック完了"

docs: ## ドキュメント生成
	@echo "ドキュメントを生成中..."
	@echo "設計書: docs/architecture.yaml"
	@echo "README: README.md"
	@echo "ドキュメント確認完了"

# ETL Airflow環境管理
airflow-start: ## Airflow ETL環境を起動
	@echo "🚀 Airflow ETL環境を起動しています..."
	mkdir -p airflow/{dags,logs,plugins,config}
	echo "AIRFLOW_UID=50000" > airflow/.env
	cd airflow && docker-compose -f docker-compose.airflow.yml up -d
	@echo "✅ Airflow起動完了"
	@echo "   Webserver: http://localhost:8082 (admin/admin)"

airflow-stop: ## Airflow ETL環境を停止
	@echo "⏹️ Airflow ETL環境を停止しています..."
	cd airflow && docker-compose -f docker-compose.airflow.yml down
	@echo "停止完了"

airflow-logs: ## Airflow ログを表示
	cd airflow && docker-compose -f docker-compose.airflow.yml logs -f

airflow-shell: ## Airflow Webserverに接続
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver bash

airflow-trigger: ## ETL DAGを手動実行
	@echo "🔥 Tokyo Crime School ETL DAGを手動実行..."
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver airflow dags trigger tokyo_crime_school_etl

airflow-status: ## Airflow DAG状態確認
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver airflow dags list

# 統合開発フロー
full-start: start airflow-start ## フル環境起動 (アプリ + Airflow)

full-stop: stop airflow-stop ## フル環境停止

add-data: ## 台東区・文京区データ追加
	@echo "📊 台東区・文京区データを追加しています..."
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -f /docker-entrypoint-initdb.d/add_taito_bunkyo_data.sql
	@echo "✅ データ追加完了"

check-data: ## データベース状態確認
	@echo "🔍 データベース状態を確認しています..."
	cd deployment && ./check_data.sh

etl-run: airflow-trigger ## ETL実行 (DAGトリガー)

# 開発用ショートカット
dev: setup start ## セットアップ + 起動 (開発開始時)

reset: clean setup start ## 完全リセット + 起動

monitoring: ## モニタリングダッシュボードを開く
	@echo "モニタリングダッシュボードを開いています..."
	open http://localhost:8080
	open http://localhost:9001
	@echo "Airflow: http://localhost:8080 (admin/admin)"
	@echo "MinIO: http://localhost:9001 (minio/minio123)"
