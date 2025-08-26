"""
犯罪データ専用ETLプロセッサー

警視庁オープンデータの月次更新に特化したETL処理を提供します。
設計書通りの犯罪データDAG専用の処理関数群です。
"""

import pandas as pd
import logging
from datetime import datetime
from typing import Dict, List

from tokyo_etl.core.database import create_postgis_engine
from tokyo_etl.core.storage import save_to_parquet
from tokyo_etl.utils.task_logging import (
    log_task_start,
    log_task_complete,
    log_error_notification,
)
from tokyo_etl.utils.data_validation import validate_crime_data
from tokyo_etl.utils.task_results import store_task_result, get_task_result
from tokyo_etl.utils.downloaders import get_mock_crime_data
from tokyo_etl.utils.geo_processors import convert_to_wgs84, add_ward_codes


def download_crime_data_task(**context) -> None:
    """
    警視庁オープンデータCSV取得

    月次更新される警視庁の犯罪統計データを取得し、
    データ品質チェックを実行します。
    """
    log_task_start("download_crime_data", **context)

    try:
        # 開発用モックデータを使用
        downloaded_files = get_mock_crime_data()

        # データ品質チェック
        quality_result = validate_crime_data(downloaded_files)

        # 結果保存
        store_task_result(context["task_instance"], "crime_files", downloaded_files)
        store_task_result(context["task_instance"], "quality_check", quality_result)

        log_task_complete(
            "download_crime_data",
            files_count=len(downloaded_files),
            quality_score=quality_result.get("score", 0),
            **context,
        )

    except Exception as e:
        log_error_notification("download_crime_data", str(e))
        raise


def transform_crime_data_task(**context) -> Dict:
    """
    犯罪データ変換・正規化

    ダウンロードした犯罪データを統一フォーマットに変換し、
    PostGIS互換の形式に正規化します。
    """
    log_task_start("transform_crime_data", **context)

    try:
        # 前タスクの結果取得
        crime_files = get_task_result(
            context["task_instance"], "download_crime_data", "crime_files"
        )

        processed_crimes = []

        for file_path in crime_files:
            # CSVパース（警視庁データの文字コード対応）
            raw_data = pd.read_csv(file_path, encoding="shift_jis")

            # 列名統一（犯罪種別、発生場所、発生日時）
            normalized_data = normalize_crime_columns(raw_data)

            # 座標変換（WGS84統一）
            geo_data = convert_to_wgs84(normalized_data)

            # 区コード追加（23区分類）
            geo_data = add_ward_codes(geo_data)

            # データ品質チェック（座標範囲、日付妥当性）
            clean_data = validate_and_clean_crime_records(geo_data)

            processed_crimes.extend(clean_data.to_dict("records"))

        # Parquet保存
        parquet_path = save_to_parquet(
            processed_crimes, "crimes", partition_cols=["ward_code", "crime_date"]
        )

        result = {
            "processed_count": len(processed_crimes),
            "parquet_path": parquet_path,
            "processing_time": datetime.now().isoformat(),
            "data_period": get_data_period_info(processed_crimes),
        }

        store_task_result(context["task_instance"], "transform_result", result)
        log_task_complete(
            "transform_crime_data", processed_count=result["processed_count"], **context
        )

        return result

    except Exception as e:
        log_error_notification("transform_crime_data", str(e))
        raise


def load_crime_to_postgis_task(**context) -> None:
    """
    犯罪データをPostGISにロード

    変換済み犯罪データをPostGISデータベースにUPSERT方式でロードし、
    空間インデックスを更新します。
    """
    log_task_start("load_crime_to_postgis", **context)

    try:
        # 前タスクの結果取得
        transform_result = get_task_result(
            context["task_instance"], "transform_crime_data", "transform_result"
        )
        parquet_path = transform_result["parquet_path"]

        # PostGIS接続
        engine = create_postgis_engine()

        # Parquet読み込み
        df = pd.read_parquet(parquet_path)

        # UPSERT実行（重複回避）
        upsert_result = upsert_crime_data(engine, df)

        # 空間インデックス更新
        refresh_spatial_indexes(engine, "crimes")

        # 統計取得
        crime_stats = get_crime_statistics(engine)

        result = {
            **upsert_result,
            **crime_stats,
            "index_updated": True,
            "load_time": datetime.now().isoformat(),
        }

        store_task_result(context["task_instance"], "load_stats", result)
        log_task_complete(
            "load_crime_to_postgis",
            new_records=upsert_result.get("inserted", 0),
            updated_records=upsert_result.get("updated", 0),
            **context,
        )

    except Exception as e:
        log_error_notification("load_crime_to_postgis", str(e))
        raise


def normalize_crime_columns(raw_data: pd.DataFrame) -> pd.DataFrame:
    """
    犯罪データの列名を統一フォーマットに正規化
    """
    # 警視庁データの列名マッピング
    column_mapping = {
        "事件種別": "crime_type",
        "発生日時": "occurrence_datetime",
        "発生場所": "location_address",
        "緯度": "latitude",
        "経度": "longitude",
    }

    # 列名変換
    normalized = raw_data.rename(columns=column_mapping)

    # 日付型変換
    if "occurrence_datetime" in normalized.columns:
        normalized["occurrence_datetime"] = pd.to_datetime(
            normalized["occurrence_datetime"], errors="coerce"
        )
        normalized["crime_date"] = normalized["occurrence_datetime"].dt.date

    # ward_code列を初期化（後でadd_ward_codesで設定）
    if "ward_code" not in normalized.columns:
        normalized["ward_code"] = None

    return normalized


def validate_and_clean_crime_records(geo_data: pd.DataFrame) -> pd.DataFrame:
    """
    犯罪レコードの妥当性検証とクリーニング
    """
    # 座標範囲チェック（東京23区の範囲内）
    tokyo_bounds = {
        "lat_min": 35.5,
        "lat_max": 35.9,
        "lng_min": 139.3,
        "lng_max": 139.9,
    }

    mask = (
        (geo_data["latitude"] >= tokyo_bounds["lat_min"])
        & (geo_data["latitude"] <= tokyo_bounds["lat_max"])
        & (geo_data["longitude"] >= tokyo_bounds["lng_min"])
        & (geo_data["longitude"] <= tokyo_bounds["lng_max"])
    )

    clean_data = geo_data[mask].copy()

    # 重複除去
    clean_data = clean_data.drop_duplicates(
        subset=["crime_type", "occurrence_datetime", "latitude", "longitude"]
    )

    return clean_data


def upsert_crime_data(engine, df: pd.DataFrame) -> Dict:
    """
    犯罪データのUPSERT処理（ハッシュベースUNIQUE制約対応）

    location_hash を使用してGEOMETRY型のUNIQUE制約問題を解決
    """
    from sqlalchemy import text

    # テンポラリテーブル作成
    temp_table = "temp_crimes_import"

    # データロード (列名正規化後)
    df.to_sql(temp_table, engine, if_exists="replace", index=False)

    # デバッグ: テンポラリテーブルの列名を確認
    debug_query = text(
        f"SELECT column_name FROM information_schema.columns WHERE table_name = '{temp_table}' ORDER BY ordinal_position"
    )
    columns_result = engine.execute(debug_query)
    actual_columns = [row[0] for row in columns_result.fetchall()]
    logging.info(f"Temp table columns: {actual_columns}")

    # ward_codeからarea_idを解決してUPSERT実行（ハッシュベースUNIQUE制約対応）
    upsert_query = text(f"""
        WITH upserted AS (
            INSERT INTO crimes (category, date, location, area_id, location_hash, created_at)
            SELECT 
                t.crime_type as category,
                t.occurrence_datetime::date as date,
                ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326) as location,
                (
                    SELECT a.id 
                    FROM areas a 
                    WHERE ST_Within(
                        ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326), 
                        a.geom
                    )
                    LIMIT 1
                ) as area_id,
                MD5(ST_AsText(ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326))) as location_hash,
                CURRENT_TIMESTAMP
            FROM {temp_table} t
            WHERE EXISTS (
                SELECT 1 FROM areas a 
                WHERE ST_Within(
                    ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326), 
                    a.geom
                )
            )
            ON CONFLICT (category, date, location_hash) 
            DO UPDATE SET 
                updated_at = CURRENT_TIMESTAMP,
                location = EXCLUDED.location,
                area_id = EXCLUDED.area_id
            RETURNING 
                CASE WHEN xmax = 0 THEN 'inserted' ELSE 'updated' END as operation
        )
        SELECT operation, COUNT(*) FROM upserted GROUP BY operation
    """)

    result = engine.execute(upsert_query).fetchall()

    # 結果集計
    stats = {"inserted": 0, "updated": 0}
    for row in result:
        stats[row[0]] = row[1]

    # テンポラリテーブル削除
    engine.execute(text(f"DROP TABLE {temp_table}"))

    return stats


def refresh_spatial_indexes(engine, table_name: str) -> None:
    """
    空間インデックスの再構築
    """
    from sqlalchemy import text

    try:
        # インデックス再構築
        index_query = text(f"""
            REINDEX INDEX idx_{table_name}_location;
            ANALYZE {table_name};
        """)

        engine.execute(index_query)
    except Exception as e:
        # インデックス名が異なる場合は警告のみ
        logging.warning(f"Could not refresh spatial index: {str(e)}")


def get_crime_statistics(engine) -> Dict:
    """
    犯罪データの統計情報取得
    """
    from sqlalchemy import text

    stats_query = text("""
        SELECT 
            COUNT(*) as total_crimes,
            COUNT(DISTINCT area_id) as covered_areas,
            MIN(date) as earliest_crime,
            MAX(date) as latest_crime,
            COUNT(DISTINCT category) as crime_types
        FROM crimes
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    """)

    result = engine.execute(stats_query).fetchone()

    return {
        "total_crimes": result[0],
        "covered_areas": result[1],
        "earliest_crime": result[2].isoformat() if result[2] else None,
        "latest_crime": result[3].isoformat() if result[3] else None,
        "crime_types": result[4],
    }


def get_data_period_info(processed_crimes: List[Dict]) -> Dict:
    """
    処理済みデータの期間情報取得
    """
    if not processed_crimes:
        return {"start_date": None, "end_date": None, "record_count": 0}

    dates = [
        crime.get("crime_date") for crime in processed_crimes if crime.get("crime_date")
    ]

    if not dates:
        return {
            "start_date": None,
            "end_date": None,
            "record_count": len(processed_crimes),
        }

    return {
        "start_date": min(dates).isoformat() if dates else None,
        "end_date": max(dates).isoformat() if dates else None,
        "record_count": len(processed_crimes),
    }
