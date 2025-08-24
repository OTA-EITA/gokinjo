"""File Operations and Validation"""

import os
import logging
from typing import Dict, List
from tokyo_etl.config.settings import FILE_PATHS


def validate_sql_file(sql_file_path: str) -> Dict:
    """SQLファイルの存在・構造確認"""
    logging.info(f"Validating SQL file: {sql_file_path}")

    if not os.path.exists(sql_file_path):
        raise FileNotFoundError(f"Required SQL file not found: {sql_file_path}")

    # ファイルサイズ確認
    file_size = os.path.getsize(sql_file_path)
    logging.info(f"  File size: {file_size} bytes")

    # 内容確認
    with open(sql_file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "INSERT INTO" in content and "areas" in content:
        logging.info("  Valid SQL file structure confirmed")
    else:
        raise ValueError("Invalid SQL file structure")

    return {"status": "valid", "file_size": file_size, "file_path": sql_file_path}


def ensure_directories() -> None:
    """必要なディレクトリの作成"""
    for path_key, path_value in FILE_PATHS.items():
        os.makedirs(path_value, exist_ok=True)
        logging.info(f"Directory ensured: {path_value}")


def create_parquet_placeholders(target_wards: List[str]) -> List[str]:
    """Parquetプレースホルダーファイル作成"""
    processed_path = FILE_PATHS["processed"]
    ensure_directories()

    parquet_files = []
    for ward_code in target_wards:
        ward_name_map = {"13106": "taito", "13105": "bunkyo"}
        ward_name = ward_name_map.get(ward_code, f"ward_{ward_code}")

        files = [
            f"{processed_path}/{ward_name}_areas.parquet",
            f"{processed_path}/{ward_name}_schools.parquet",
            f"{processed_path}/{ward_name}_crimes.parquet",
        ]

        for file in files:
            with open(file, "w") as f:
                f.write(f"# Parquet placeholder for {os.path.basename(file)}")
            parquet_files.append(file)

    logging.info(f"Created {len(parquet_files)} parquet placeholder files")
    return parquet_files


def get_priority_2_sql_file() -> str:
    """Priority 2区用SQLファイルパス取得"""
    return os.path.join(FILE_PATHS["sql_districts"], "taito_bunkyo_data.sql")
