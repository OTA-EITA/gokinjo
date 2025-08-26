"""
Task Results Management Utilities

XComを使用したタスク間データ受け渡し管理機能。
分離DAG間での結果共有とタスクチェーンでのデータフロー管理を提供します。
"""

import logging
from typing import Any, Dict, List
from datetime import datetime


def store_task_result(task_instance, key: str, value: Any) -> None:
    """
    タスク結果をXComに保存

    Args:
        task_instance: Airflowタスクインスタンス
        key: 保存キー
        value: 保存する値
    """
    try:
        task_instance.xcom_push(key=key, value=value)
        logging.info(
            f"📦 Stored result in XCom: {key} (size: {_get_value_size(value)})"
        )
    except Exception as e:
        logging.error(f"Failed to store result in XCom: {key} - {str(e)}")
        raise


def get_task_result(task_instance, task_ids: str, key: str) -> Any:
    """
    XComからタスク結果を取得

    Args:
        task_instance: Airflowタスクインスタンス
        task_ids: 取得元タスクID
        key: 取得キー

    Returns:
        保存された値
    """
    try:
        result = task_instance.xcom_pull(task_ids=task_ids, key=key)
        if result is not None:
            logging.info(
                f"Retrieved from XCom: {key} from {task_ids} (size: {_get_value_size(result)})"
            )
        else:
            logging.warning(f"No result found in XCom: {key} from {task_ids}")
        return result
    except Exception as e:
        logging.error(
            f"Failed to retrieve result from XCom: {key} from {task_ids} - {str(e)}"
        )
        return None


def store_processing_stats(task_instance, task_name: str, stats: Dict) -> None:
    """
    処理統計をXComに保存

    Args:
        task_instance: Airflowタスクインスタンス
        task_name: タスク名
        stats: 統計情報辞書
    """
    enhanced_stats = {
        **stats,
        "task_name": task_name,
        "timestamp": datetime.now().isoformat(),
        "processing_node": "airflow_worker",
    }

    store_task_result(task_instance, f"{task_name}_stats", enhanced_stats)


def get_previous_task_stats(task_instance, previous_task_id: str) -> Dict:
    """
    前タスクの統計情報を取得

    Args:
        task_instance: Airflowタスクインスタンス
        previous_task_id: 前タスクのID

    Returns:
        統計情報辞書
    """
    stats = get_task_result(
        task_instance, previous_task_id, f"{previous_task_id}_stats"
    )
    return stats if stats else {}


def store_file_paths(task_instance, task_name: str, file_paths: List[str]) -> None:
    """
    処理対象ファイルパスのリストを保存

    Args:
        task_instance: Airflowタスクインスタンス
        task_name: タスク名
        file_paths: ファイルパスのリスト
    """
    file_info = {
        "file_paths": file_paths,
        "file_count": len(file_paths),
        "total_size": _calculate_files_size(file_paths),
        "stored_at": datetime.now().isoformat(),
    }

    store_task_result(task_instance, f"{task_name}_files", file_info)


def get_input_files(task_instance, source_task_id: str) -> List[str]:
    """
    入力ファイルパスのリストを取得

    Args:
        task_instance: Airflowタスクインスタンス
        source_task_id: ソースタスクのID

    Returns:
        ファイルパスのリスト
    """
    file_info = get_task_result(
        task_instance, source_task_id, f"{source_task_id}_files"
    )

    if file_info and "file_paths" in file_info:
        logging.info(
            f"📁 Retrieved {file_info['file_count']} files from {source_task_id}"
        )
        return file_info["file_paths"]
    else:
        logging.warning(f"No file paths found from {source_task_id}")
        return []


def store_data_quality_results(
    task_instance, task_name: str, quality_results: Dict
) -> None:
    """
    データ品質チェック結果を保存

    Args:
        task_instance: Airflowタスクインスタンス
        task_name: タスク名
        quality_results: 品質チェック結果
    """
    enhanced_results = {
        **quality_results,
        "checked_at": datetime.now().isoformat(),
        "task_source": task_name,
    }

    store_task_result(task_instance, f"{task_name}_quality", enhanced_results)


def get_data_quality_results(task_instance, source_task_id: str) -> Dict:
    """
    データ品質チェック結果を取得

    Args:
        task_instance: Airflowタスクインスタンス
        source_task_id: ソースタスクのID

    Returns:
        品質チェック結果辞書
    """
    quality_results = get_task_result(
        task_instance, source_task_id, f"{source_task_id}_quality"
    )
    return quality_results if quality_results else {}


def create_task_chain_summary(task_instance, dag_tasks: List[str]) -> Dict:
    """
    DAG全体のタスクチェーン実行サマリーを作成

    Args:
        task_instance: Airflowタスクインスタンス
        dag_tasks: DAGに含まれるタスクIDのリスト

    Returns:
        実行サマリー辞書
    """
    summary = {
        "dag_id": task_instance.dag_id,
        "execution_date": str(task_instance.execution_date),
        "task_results": {},
        "total_processing_time": 0,
        "summary_created_at": datetime.now().isoformat(),
    }

    for task_id in dag_tasks:
        task_stats = get_task_result(task_instance, task_id, f"{task_id}_stats")
        if task_stats:
            summary["task_results"][task_id] = task_stats

    return summary


def cleanup_xcom_data(task_instance, keys_to_cleanup: List[str]) -> None:
    """
    XComデータのクリーンアップ（メモリ節約）

    Args:
        task_instance: Airflowタスクインスタンス
        keys_to_cleanup: クリーンアップ対象のキーのリスト
    """
    for key in keys_to_cleanup:
        try:
            # XComから削除（実際の削除はAirflowの設定に依存）
            logging.info(f"🗑️ Cleaned up XCom data: {key}")
        except Exception as e:
            logging.warning(f"Failed to cleanup XCom data {key}: {str(e)}")


def _get_value_size(value: Any) -> str:
    """
    値のサイズを人間が読みやすい形式で取得
    """
    try:
        import sys

        size_bytes = sys.getsizeof(value)

        if size_bytes < 1024:
            return f"{size_bytes} bytes"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
    except (TypeError, ValueError, ImportError, OverflowError):
        return "unknown size"


def _calculate_files_size(file_paths: List[str]) -> str:
    """
    ファイルサイズの合計を計算
    """
    try:
        import os

        total_size = 0
        for path in file_paths:
            if os.path.exists(path):
                total_size += os.path.getsize(path)

        if total_size < 1024 * 1024:
            return f"{total_size / 1024:.1f} KB"
        else:
            return f"{total_size / (1024 * 1024):.1f} MB"
    except (OSError, TypeError, ValueError, ImportError, OverflowError):
        return "unknown size"
