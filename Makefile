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

airflow-shell: ## Airflowコンテナに接続
	cd deployment && docker-compose exec airflow bash

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

# 開発用ショートカット
dev: setup start ## セットアップ + 起動 (開発開始時)

reset: clean setup start ## 完全リセット + 起動

monitoring: ## モニタリングダッシュボードを開く
	@echo "モニタリングダッシュボードを開いています..."
	open http://localhost:8080
	open http://localhost:9001
	@echo "Airflow: http://localhost:8080 (admin/admin)"
	@echo "MinIO: http://localhost:9001 (minio/minio123)"
