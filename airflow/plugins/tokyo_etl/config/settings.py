"""Tokyo ETL Pipeline Configuration"""

from datetime import datetime, timedelta

# Airflow DAG設定
DEFAULT_ARGS = {
    "owner": "tokyo-neighborhood-mapping",
    "depends_on_past": False,
    "start_date": datetime(2025, 8, 24),
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
    "catchup": False,
}

# データベース設定
DATABASE_CONFIG = {
    "app_db_url": "postgresql://postgres:password@postgis:5432/neighborhood_mapping",
    "timeout": 30,
    "pool_size": 5,
}

# ファイルパス設定
FILE_PATHS = {
    "raw_data": "/opt/airflow/data/raw",
    "processed": "/opt/airflow/data/processed",
    "curated": "/opt/airflow/data/curated",
    "sql_districts": "/opt/airflow/sql/districts",
}

# 安全スコア計算設定
SAFETY_SCORE_CONFIG = {
    "radius_meters": 500,
    "base_score": 100,
    "crime_penalty": 10,
    "min_score": 0,
    "recent_months": 3,
}
