"""
Logging and Task Management Utilities

設計書に基づく分離DAG対応のログ・タスク管理機能を提供します。
"""

import logging
from datetime import datetime
from typing import Dict, Any


def log_task_start(task_name: str, **context) -> None:
    """タスク開始ログ"""
    logging.info(f"🚀 Starting task: {task_name}")
    logging.info(f"   📅 Execution date: {context.get('ds', 'N/A')}")
    logging.info(f"   🔄 DAG run ID: {context.get('run_id', 'N/A')}")
    logging.info(f"   📍 Task instance: {context.get('task_instance_key_str', 'N/A')}")
    logging.info(f"   ⏰ Start time: {datetime.now().isoformat()}")


def log_task_complete(task_name: str, **kwargs) -> None:
    """
    タスク完了ログ（追加の統計情報付き）
    """
    logging.info(f"✅ Completed task: {task_name}")
    logging.info(f"   ⏰ Completion time: {datetime.now().isoformat()}")

    # 追加統計情報のログ出力
    for key, value in kwargs.items():
        if key not in ["ds", "run_id", "task_instance_key_str"]:
            logging.info(f"   📊 {key}: {value}")


def log_error_notification(task_name: str, error_msg: str) -> None:
    """
    エラー通知ログ
    """
    logging.error(f"❌ Error in task: {task_name}")
    logging.error(f"   🔥 Error message: {error_msg}")
    logging.error(f"   ⏰ Error time: {datetime.now().isoformat()}")

    # エラー対処のガイダンス
    logging.error("🔧 Troubleshooting steps:")
    logging.error("   1. Check Airflow logs for detailed stack trace")
    logging.error("   2. Verify database connectivity")
    logging.error("   3. Check data source availability")
    logging.error("   4. Validate input data format")


def store_task_result(task_instance, key: str, value: Any) -> None:
    """タスク結果をXComに保存"""
    task_instance.xcom_push(key=key, value=value)
    logging.info(f"💾 Stored result in XCom: {key}")


def get_task_result(task_instance, task_ids: str, key: str) -> Any:
    """XComからタスク結果を取得"""
    result = task_instance.xcom_pull(task_ids=task_ids, key=key)
    logging.info(f"📤 Retrieved from XCom: {key} from {task_ids}")
    return result


def log_database_stats(stats: Dict) -> None:
    """データベース統計情報ログ"""
    logging.info("📊 Database Statistics:")
    for key, value in stats.items():
        logging.info(f"   • {key}: {value}")


def log_data_quality_check(results: Dict) -> None:
    """
    データ品質チェック結果のログ
    """
    logging.info("🔍 Data Quality Check Results:")
    for metric, value in results.items():
        if isinstance(value, (int, float)):
            logging.info(f"   • {metric}: {value}")
        else:
            logging.info(f"   • {metric}: {str(value)}")


def log_processing_stats(
    task_name: str, processed_count: int, total_time_seconds: float = None
) -> None:
    """
    処理統計のログ
    """
    logging.info(f"📈 Processing stats for {task_name}:")
    logging.info(f"   • Records processed: {processed_count:,}")

    if total_time_seconds:
        logging.info(f"   • Processing time: {total_time_seconds:.2f} seconds")
        if processed_count > 0:
            rate = processed_count / total_time_seconds
            logging.info(f"   • Processing rate: {rate:.2f} records/second")


def create_task_summary(task_name: str, results: Dict) -> Dict:
    """タスクサマリー作成"""
    return {
        "task_name": task_name,
        "completion_time": datetime.now().isoformat(),
        "results": results,
        "status": "success",
    }


def log_dag_context(context: Dict) -> None:
    """
    DAGコンテキスト情報のログ（デバッグ用）
    """
    logging.info("🔧 DAG Context Information:")
    logging.info(f"   • DAG ID: {context.get('dag', {}).get('dag_id', 'N/A')}")
    logging.info(f"   • Task ID: {context.get('task', {}).get('task_id', 'N/A')}")
    logging.info(f"   • Execution Date: {context.get('execution_date', 'N/A')}")
    logging.info(f"   • Run ID: {context.get('run_id', 'N/A')}")


# 既存関数も維持（互換性のため）
def log_task_start_legacy(task_name: str, **context) -> None:
    """タスク開始ログ"""
    logging.info(f"Starting task: {task_name}")
    logging.info(f"   Execution date: {context.get('ds', 'N/A')}")
    logging.info(f"   DAG run ID: {context.get('run_id', 'N/A')}")
    logging.info(f"   Task instance: {context.get('task_instance_key_str', 'N/A')}")


def log_task_complete_legacy(task_name: str, **context) -> None:
    """タスク完了ログ"""
    logging.info(f"Completed task: {task_name}")
    logging.info(f"   Duration: {datetime.now().isoformat()}")
