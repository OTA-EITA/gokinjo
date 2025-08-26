"""
Data Download Utilities

各種データソースからのファイルダウンロード機能。
犯罪データ・学校データの取得を統一的に処理します。
"""

import os
import requests
import logging
from typing import List
from datetime import datetime
from pathlib import Path


def download_from_sources(
    source_urls: List[str], data_type: str = "general"
) -> List[str]:
    """
    複数ソースからファイルをダウンロード

    Args:
        source_urls: ダウンロード対象URLのリスト
        data_type: データタイプ（ログ用）

    Returns:
        ダウンロードしたファイルパスのリスト
    """
    downloaded_files = []
    download_dir = _get_download_directory(data_type)

    logging.info(
        f"📥 Starting download of {data_type} data from {len(source_urls)} sources"
    )

    for i, url in enumerate(source_urls):
        try:
            file_path = download_single_file(url, download_dir, data_type, i)
            if file_path:
                downloaded_files.append(file_path)
                logging.info(f"Downloaded: {file_path}")
        except Exception as e:
            logging.error(f"Failed to download {url}: {str(e)}")
            # 一つのファイルが失敗しても他は続行
            continue

    logging.info(
        f"📊 Download summary: {len(downloaded_files)}/{len(source_urls)} files successful"
    )
    return downloaded_files


def download_single_file(
    url: str, download_dir: Path, data_type: str, index: int = 0
) -> str:
    """
    単一ファイルのダウンロード

    Args:
        url: ダウンロードURL
        download_dir: 保存ディレクトリ
        data_type: データタイプ
        index: ファイル番号

    Returns:
        ダウンロードしたファイルのパス
    """
    # ファイル名を生成
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{data_type}_{timestamp}_{index}.csv"
    file_path = download_dir / filename

    # HTTPリクエスト設定
    headers = {
        "User-Agent": "Tokyo-Crime-School-ETL/1.0 (Data Integration Purpose)",
        "Accept": "text/csv,application/csv,text/plain,*/*",
    }

    # ダウンロード実行
    response = requests.get(url, headers=headers, stream=True, timeout=30)
    response.raise_for_status()

    # ファイル保存
    with open(file_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    # ファイルサイズ確認
    file_size = os.path.getsize(file_path)
    logging.info(f"📁 File saved: {filename} ({file_size:,} bytes)")

    return str(file_path)


def download_with_retry(url: str, max_retries: int = 3) -> requests.Response:
    """
    リトライ機能付きダウンロード

    Args:
        url: ダウンロードURL
        max_retries: 最大リトライ回数

    Returns:
        HTTPレスポンス
    """
    for attempt in range(max_retries + 1):
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            if attempt < max_retries:
                wait_time = 2**attempt  # 指数バックオフ
                logging.warning(
                    f"Download attempt {attempt + 1} failed, retrying in {wait_time}s: {str(e)}"
                )
                import time

                time.sleep(wait_time)
            else:
                logging.error(f"All download attempts failed for {url}")
                raise


def verify_download_integrity(file_path: str, expected_min_size: int = 100) -> bool:
    """
    ダウンロードファイルの整合性確認

    Args:
        file_path: ファイルパス
        expected_min_size: 期待する最小ファイルサイズ

    Returns:
        整合性チェック結果
    """
    try:
        if not os.path.exists(file_path):
            logging.error(f"File not found: {file_path}")
            return False

        file_size = os.path.getsize(file_path)
        if file_size < expected_min_size:
            logging.error(f"File too small: {file_path} ({file_size} bytes)")
            return False

        # CSVの基本的な構造チェック
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            first_line = f.readline().strip()
            if not first_line or "," not in first_line:
                logging.error(f"Invalid CSV structure: {file_path}")
                return False

        logging.info(f"File integrity verified: {file_path}")
        return True

    except Exception as e:
        logging.error(f"File integrity check failed: {file_path} - {str(e)}")
        return False


def cleanup_old_downloads(data_type: str, keep_days: int = 7) -> None:
    """
    古いダウンロードファイルのクリーンアップ

    Args:
        data_type: データタイプ
        keep_days: 保持日数
    """
    download_dir = _get_download_directory(data_type)
    cutoff_time = datetime.now().timestamp() - (keep_days * 24 * 3600)

    cleaned_count = 0
    for file_path in download_dir.glob(f"{data_type}_*.csv"):
        try:
            if file_path.stat().st_mtime < cutoff_time:
                file_path.unlink()
                cleaned_count += 1
        except Exception as e:
            logging.warning(f"Failed to cleanup {file_path}: {str(e)}")

    if cleaned_count > 0:
        logging.info(f"Cleaned up {cleaned_count} old {data_type} files")


def _get_download_directory(data_type: str) -> Path:
    """
    データタイプ別のダウンロードディレクトリを取得

    Args:
        data_type: データタイプ

    Returns:
        ダウンロードディレクトリのPath
    """
    # プロジェクトルートからの相対パス
    base_dir = Path("/opt/airflow/data/raw") / data_type
    base_dir.mkdir(parents=True, exist_ok=True)
    return base_dir


def get_mock_crime_data() -> List[str]:
    """
    開発用：モック犯罪データファイルを作成

    Returns:
        作成したモックファイルのパスリスト
    """
    mock_data = """事件種別,発生日時,発生場所,緯度,経度
侵入窃盗,2024-01-15 10:30:00,台東区浅草1-1-1,35.7148,139.7967
路上強盗,2024-01-16 22:15:00,文京区本郷3-3-3,35.7089,139.7624
自転車盗,2024-01-17 14:20:00,台東区上野2-2-2,35.7090,139.7740
"""

    download_dir = _get_download_directory("crime")
    mock_file = (
        download_dir / f"mock_crime_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    )

    with open(mock_file, "w", encoding="shift_jis") as f:
        f.write(mock_data)

    logging.info(f"📝 Created mock crime data: {mock_file}")
    return [str(mock_file)]


def get_mock_school_data() -> List[str]:
    """
    開発用：モック学校データファイルを作成

    Returns:
        作成したモックファイルのパスリスト
    """
    mock_data = """学校名,学校種別,住所,緯度,経度,設置者
台東区立浅草小学校,小学校,台東区浅草1-1-1,35.7148,139.7967,区立
文京区立本郷中学校,中学校,文京区本郷3-3-3,35.7089,139.7624,区立
東京都立上野高等学校,高等学校,台東区上野2-2-2,35.7090,139.7740,都立
"""

    download_dir = _get_download_directory("school")
    mock_file = (
        download_dir
        / f"mock_school_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    )

    with open(mock_file, "w", encoding="utf-8") as f:
        f.write(mock_data)

    logging.info(f"📝 Created mock school data: {mock_file}")
    return [str(mock_file)]
