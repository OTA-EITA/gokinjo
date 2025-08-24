"""Database Connection and Operations"""

import logging
import os
from sqlalchemy import create_engine
from airflow.providers.postgres.hooks.postgres import PostgresHook
from typing import Dict
from tokyo_etl.config.settings import DATABASE_CONFIG


def get_app_db_connection():
    """アプリケーションデータベース接続を取得"""
    app_db_url = os.getenv("APP_DATABASE_URL", DATABASE_CONFIG["app_db_url"])
    return create_engine(app_db_url)


def get_postgres_hook() -> PostgresHook:
    """Airflow PostgresHook取得"""
    return PostgresHook(postgres_conn_id="postgres_default")


def execute_sql_file(sql_file_path: str, hook: PostgresHook = None) -> Dict:
    """SQLファイル実行"""
    if not hook:
        hook = get_postgres_hook()

    logging.info(f"Executing SQL file: {sql_file_path}")

    try:
        with open(sql_file_path, "r", encoding="utf-8") as f:
            sql_content = f.read()

        # SQL文分割実行
        statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]

        executed_count = 0
        for stmt in statements:
            if stmt and not stmt.startswith("--"):
                try:
                    hook.run(stmt)
                    executed_count += 1
                except Exception as e:
                    logging.warning(f"SQL statement warning: {str(e)}")

        logging.info(f"Executed {executed_count} SQL statements")

        return {
            "status": "success",
            "statements_executed": executed_count,
            "file": sql_file_path,
        }

    except Exception as e:
        logging.error(f"Error executing SQL file {sql_file_path}: {str(e)}")
        raise


def get_database_stats() -> Dict:
    """データベース統計情報取得"""
    engine = get_app_db_connection()

    with engine.connect() as conn:
        # 基本統計
        areas_count = conn.execute("SELECT COUNT(*) FROM areas").fetchone()[0]
        schools_count = conn.execute("SELECT COUNT(*) FROM schools").fetchone()[0]
        crimes_count = conn.execute("SELECT COUNT(*) FROM crimes").fetchone()[0]

        # Priority 2区（台東区・文京区）統計
        new_areas = conn.execute("""
            SELECT COUNT(*) FROM areas 
            WHERE ward_code IN ('13106', '13105')
        """).fetchone()[0]

        return {
            "total_areas": areas_count,
            "total_schools": schools_count,
            "total_crimes": crimes_count,
            "priority_2_areas": new_areas,
        }


def check_database_connection() -> Dict:
    """データベース接続確認"""
    try:
        engine = get_app_db_connection()

        with engine.connect() as conn:
            # PostgreSQL バージョン確認
            result = conn.execute("SELECT version()")
            db_version = result.fetchone()[0]

            # PostGIS バージョン確認
            result = conn.execute("SELECT PostGIS_version()")
            postgis_version = result.fetchone()[0]

            logging.info(f"Connected to PostgreSQL: {db_version}")
            logging.info(f"PostGIS version: {postgis_version}")

            return {
                "status": "success",
                "postgresql_version": db_version,
                "postgis_version": postgis_version,
            }

    except Exception as e:
        logging.error(f"Database connection failed: {str(e)}")
        return {"status": "failed", "error": str(e)}
