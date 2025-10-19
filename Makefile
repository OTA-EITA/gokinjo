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
	@echo "開発環境をクリーンアップしています..."
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
	@echo "Airflow ETL環境を起動しています..."
	mkdir -p airflow/{dags,logs,plugins,config}
	@if [ ! -f airflow/.env ]; then echo ".envファイルを手動で作成してください: echo 'AIRFLOW_UID=50000' > airflow/.env"; fi
	cd airflow && docker-compose -f docker-compose.airflow.yml up -d
	@echo "Airflow起動完了"
	@echo "   Webserver: http://localhost:8082 (admin/admin)"

airflow-stop: ## Airflow ETL環境を停止
	@echo "Airflow ETL環境を停止しています..."
	cd airflow && docker-compose -f docker-compose.airflow.yml down
	@echo "停止完了"

airflow-logs: ## Airflow ログを表示
	cd airflow && docker-compose -f docker-compose.airflow.yml logs -f

airflow-shell: ## Airflow Webserverに接続
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver bash

airflow-trigger: ## ETL DAGを手動実行
	@echo "Tokyo Crime School ETL DAGを手動実行..."
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver airflow dags trigger tokyo_crime_school_etl

airflow-status: ## Airflow DAG状態確認
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver airflow dags list

airflow-restart: airflow-stop airflow-start ## Airflow環境再起動

airflow-list-dags: ## DAG詳細リスト表示
	@echo "利用可能なDAG一覧:"
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver airflow dags list

airflow-run-dag: ## 指定DAGを手動実行 (make airflow-run-dag DAG_ID=dag_name)
	@if [ -z "$(DAG_ID)" ]; then echo "DAG_IDを指定してください: make airflow-run-dag DAG_ID=tokyo_crime_etl"; exit 1; fi
	@echo "DAG実行: $(DAG_ID)"
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver airflow dags trigger $(DAG_ID)

test-dag: ## テスト用DAG実行
	@echo "テストDAG実行中..."
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver airflow dags trigger test_crime_etl

airflow-ui: ## Airflow Web UIを開く
	@echo "Airflow Web UIを開いています..."
	open http://localhost:8082
	@echo "ログイン情報: admin / admin"

# 統合開発フロー
full-start: start airflow-start ## フル環境起動 (アプリ + Airflow)

full-stop: stop airflow-stop ## フル環境停止

add-data: ## 台東区・文京区データ追加
	@echo "台東区・文京区データを追加しています..."
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -f /docker-entrypoint-initdb.d/add_taito_bunkyo_data.sql
	@echo "データ追加完了"

check-data: ## データベース状態確認
	@echo "データベース状態を確認しています..."
	cd deployment && ./check_data.sh

etl-run: airflow-trigger ## ETL実行 (DAGトリガー)

# DDL修正・制約管理（統合完了につき不要）
# fix-constraints: ## UNIQUE制約を修正（DDL・DAG整合性問題を解決）
# 	@echo "🔧 DDL・DAG整合性修正を実行中..."
# 	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -f /docker-entrypoint-initdb.d/fix_unique_constraints.sql
# 	@echo "✅ UNIQUE制約修正完了"

# fix-geometry-constraints: ## GEOMETRY型対応UNIQUE制約修正（最終解決版）
# 	@echo "🔧 GEOMETRY対応UNIQUE制約修正を実行中..."
# 	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -f /docker-entrypoint-initdb.d/fix_geometry_unique_constraint.sql
# 	@echo "✅ GEOMETRY対応UNIQUE制約修正完了"

db-backup: ## データベースバックアップ
	@echo "データベースバックアップ中..."
	mkdir -p backups
	cd deployment && docker-compose exec -T postgis pg_dump -U postgres neighborhood_mapping > ../backups/db_backup_$(date +%Y%m%d_%H%M%S).sql
	@echo "バックアップ完了: backups/"

validate-ddl: ## DDL・DAG整合性チェック
	@echo "DDL・DAG整合性をチェック中..."
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -c "SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'crimes';"
	@echo "制約確認完了"

# 開発用ショートカット
dev: setup start ## セットアップ + 起動 (開発開始時)

fix-and-test: fix-constraints airflow-restart airflow-run-dag ## 制約修正 + Airflow再起動 + DAGテスト実行
	@echo "制約修正・テスト実行完了"

reset: clean setup start ## 完全リセット + 起動

monitoring: ## モニタリングダッシュボードを開く
	@echo "モニタリングダッシュボードを開いています..."
	open http://localhost:8080
	open http://localhost:9001
	@echo "Airflow: http://localhost:8080 (admin/admin)"
	@echo "MinIO: http://localhost:9001 (minio/minio123)"

# Phase 3: Priority 3区データ拡張（for文版）
add-priority3: ## Priority 3区データ一括追加（墨田・江東・品川・目黒区）
	@echo "Priority 3区データ一括追加開始..."
	chmod +x scripts/add_priority3_original.sh
	./scripts/add_priority3_original.sh
	@echo "Priority 3区データ追加完了"

run-priority3: ## Priority 3区処理DAG実行
	@echo "Priority 3区処理DAG実行中..."
	cd airflow && docker-compose -f docker-compose.airflow.yml exec airflow-webserver airflow dags trigger tokyo_crime_school_etl_priority3_generic
	@echo "DAG実行開始"

test-config: ## 区設定ファイルテスト
	@echo "区設定ファイルをテスト中..."
	cd airflow && docker-compose -f docker-compose.airflow.yml exec -T airflow-scheduler python -c "import sys; sys.path.append('/opt/airflow/plugins'); from tokyo_etl.config.district_data import get_districts_by_priority; districts = get_districts_by_priority(3); print(f'Priority 3区: {len(districts)}区'); [print(f'  {data[\"name\"]} ({ward_code}): エリア{len(data[\"areas\"])}, 学校{len(data[\"schools\"])}, 犯罪{len(data[\"crimes\"])}') for ward_code, data in districts.items()]"
	@echo "設定ファイルテスト完了"

check-priority3: ## Priority 3区データ確認
	@echo "Priority 3区データ状況確認..."
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -c "\
		SELECT 'Priority 3区データ状況' as summary, \
		COUNT(DISTINCT ward_code) as ward_count, \
		COUNT(DISTINCT a.id) as total_areas, \
		COUNT(DISTINCT s.id) as total_schools, \
		COUNT(DISTINCT c.id) as total_crimes \
		FROM areas a LEFT JOIN schools s ON s.area_id = a.id LEFT JOIN crimes c ON c.area_id = a.id \
		WHERE a.ward_code IN ('13107', '13108', '13109', '13110'); \
		SELECT ward_code, COUNT(DISTINCT a.id) as areas, COUNT(DISTINCT s.id) as schools, COUNT(DISTINCT c.id) as crimes \
		FROM areas a LEFT JOIN schools s ON s.area_id = a.id LEFT JOIN crimes c ON c.area_id = a.id \
		WHERE a.ward_code IN ('13107', '13108', '13109', '13110') \
		GROUP BY ward_code ORDER BY ward_code;"
	@echo "データ確認完了"

# Phase 3データ投入（最新版）
load-priority3: ## Priority 3区データ投入（墨田・江東・品川・目黒）
	@echo "Priority 3区データ投入開始..."
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping < sql/districts/priority3/load_all_priority3.sql
	@echo "Priority 3区データ投入完了"

load-sumida: ## 墨田区データのみ投入
	@echo "墨田区データ投入中..."
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping < sql/districts/priority3/sumida_district_data.sql
	@echo "墨田区データ投入完了"

load-koto: ## 江東区データのみ投入
	@echo "江東区データ投入中..."
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping < sql/districts/priority3/koto_district_data.sql
	@echo "江東区データ投入完了"

load-shinagawa: ## 品川区データのみ投入
	@echo "品川区データ投入中..."
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping < sql/districts/priority3/shinagawa_district_data.sql
	@echo "品川区データ投入完了"

load-meguro: ## 目黒区データのみ投入
	@echo "目黒区データ投入中..."
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping < sql/districts/priority3/meguro_district_data.sql
	@echo "目黒区データ投入完了"

verify-priority3: ## Priority 3区データ検証
	@echo "Priority 3区データ検証中..."
	@echo "========================================"
	@echo "全体統計"
	@echo "========================================"
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -c "SELECT COUNT(DISTINCT ward_code) as total_wards, COUNT(DISTINCT s.id) as total_schools, COUNT(DISTINCT c.id) as total_crimes FROM areas a LEFT JOIN schools s ON s.area_id = a.id LEFT JOIN crimes c ON c.area_id = a.id;"
	@echo ""
	@echo "========================================"
	@echo "Priority 3区別統計"
	@echo "========================================"
	cd deployment && docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -c "SELECT a.ward_code, CASE WHEN a.ward_code = '13107' THEN '墨田区' WHEN a.ward_code = '13108' THEN '江東区' WHEN a.ward_code = '13109' THEN '品川区' WHEN a.ward_code = '13110' THEN '目黒区' END as ward_name, COUNT(DISTINCT a.id) as areas, COUNT(DISTINCT s.id) as schools, COUNT(DISTINCT c.id) as crimes FROM areas a LEFT JOIN schools s ON s.area_id = a.id LEFT JOIN crimes c ON c.area_id = a.id WHERE a.ward_code IN ('13107', '13108', '13109', '13110') GROUP BY a.ward_code ORDER BY a.ward_code;"
	@echo "検証完了"
