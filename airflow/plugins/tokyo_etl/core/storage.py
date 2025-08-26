"""
Core Storage Operations

データ保存・取得に関する共通機能を提供します。
"""

import pandas as pd
import logging
from pathlib import Path
from typing import List, Dict, Optional


def save_to_parquet(
    data: List[Dict], table_name: str, partition_cols: Optional[List[str]] = None
) -> str:
    """
    データをParquet形式で保存

    Args:
        data: 保存するデータのリスト
        table_name: テーブル名
        partition_cols: パーティション列のリスト

    Returns:
        保存されたファイルパス
    """
    # データディレクトリ確保
    base_dir = Path("/opt/airflow/data/processed")
    base_dir.mkdir(parents=True, exist_ok=True)

    # データフレーム変換
    df = pd.DataFrame(data)

    # ファイルパス決定
    from datetime import datetime

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{table_name}_{timestamp}.parquet"
    file_path = base_dir / filename

    # Parquet保存
    if partition_cols and all(col in df.columns for col in partition_cols):
        # パーティション保存
        partition_dir = base_dir / f"{table_name}_partitioned_{timestamp}"
        df.to_parquet(partition_dir, partition_cols=partition_cols, index=False)
        logging.info(
            f"Saved partitioned parquet: {partition_dir} ({len(df)} records)"
        )
        return str(partition_dir)
    else:
        # 単一ファイル保存
        df.to_parquet(file_path, index=False)
        logging.info(f"Saved parquet file: {filename} ({len(df)} records)")
        return str(file_path)


def get_parquet_path(table_name: str) -> Optional[str]:
    """
    テーブル名から最新のParquetファイルパスを取得

    Args:
        table_name: テーブル名

    Returns:
        最新のParquetファイルパス
    """
    base_dir = Path("/opt/airflow/data/processed")

    # パターンマッチでファイル検索
    parquet_files = list(base_dir.glob(f"{table_name}_*.parquet"))
    parquet_dirs = list(base_dir.glob(f"{table_name}_partitioned_*"))

    all_paths = parquet_files + parquet_dirs

    if not all_paths:
        logging.warning(f"No parquet files found for table: {table_name}")
        return None

    # 最新のファイルを返す（タイムスタンプ順）
    latest_path = max(all_paths, key=lambda p: p.stat().st_mtime)
    return str(latest_path)


def load_from_parquet(file_path: str) -> pd.DataFrame:
    """
    Parquetファイルからデータを読み込み

    Args:
        file_path: Parquetファイルパス

    Returns:
        データフレーム
    """
    try:
        df = pd.read_parquet(file_path)
        logging.info(f"Loaded parquet file: {file_path} ({len(df)} records)")
        return df
    except Exception as e:
        logging.error(f"Failed to load parquet file {file_path}: {str(e)}")
        raise


def cleanup_old_files(table_name: str, keep_count: int = 3) -> None:
    """
    古いParquetファイルのクリーンアップ

    Args:
        table_name: テーブル名
        keep_count: 保持するファイル数
    """
    base_dir = Path("/opt/airflow/data/processed")

    # 該当ファイル取得
    parquet_files = list(base_dir.glob(f"{table_name}_*.parquet"))
    parquet_dirs = list(base_dir.glob(f"{table_name}_partitioned_*"))

    all_paths = parquet_files + parquet_dirs

    if len(all_paths) <= keep_count:
        return

    # 古いファイルから削除
    sorted_paths = sorted(all_paths, key=lambda p: p.stat().st_mtime, reverse=True)
    files_to_remove = sorted_paths[keep_count:]

    removed_count = 0
    for path_to_remove in files_to_remove:
        try:
            if path_to_remove.is_dir():
                import shutil

                shutil.rmtree(path_to_remove)
            else:
                path_to_remove.unlink()
            removed_count += 1
        except Exception as e:
            logging.warning(f"Failed to remove {path_to_remove}: {str(e)}")

    if removed_count > 0:
        logging.info(f"🗑️ Cleaned up {removed_count} old {table_name} files")


def get_storage_stats() -> Dict:
    """
    ストレージ統計情報を取得

    Returns:
        ストレージ統計辞書
    """
    base_dir = Path("/opt/airflow/data")

    stats = {
        "raw_files": 0,
        "processed_files": 0,
        "total_size_mb": 0,
        "directories": [],
    }

    # 各ディレクトリの統計
    for subdir in ["raw", "processed", "curated"]:
        dir_path = base_dir / subdir
        if dir_path.exists():
            files = list(dir_path.rglob("*"))
            file_count = len([f for f in files if f.is_file()])

            # サイズ計算
            total_size = sum(f.stat().st_size for f in files if f.is_file())
            size_mb = total_size / (1024 * 1024)

            stats["directories"].append(
                {"name": subdir, "file_count": file_count, "size_mb": round(size_mb, 2)}
            )

            if subdir == "raw":
                stats["raw_files"] = file_count
            elif subdir == "processed":
                stats["processed_files"] = file_count

            stats["total_size_mb"] += size_mb

    stats["total_size_mb"] = round(stats["total_size_mb"], 2)

    return stats


def ensure_data_directories() -> None:
    """
    必要なデータディレクトリを作成
    """
    base_dir = Path("/opt/airflow/data")

    directories = ["raw/crime", "raw/school", "processed", "curated"]

    for directory in directories:
        dir_path = base_dir / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        logging.info(f"📁 Ensured directory: {dir_path}")
