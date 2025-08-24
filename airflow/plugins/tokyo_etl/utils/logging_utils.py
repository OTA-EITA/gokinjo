"""Logging and Task Management Utilities"""

import logging
from datetime import datetime
from typing import Dict, Any


def log_task_start(task_name: str, **context) -> None:
    """タスク開始ログ"""
    logging.info(f"Starting task: {task_name}")
    logging.info(f"   Execution date: {context.get('ds', 'N/A')}")
    logging.info(f"   DAG run ID: {context.get('run_id', 'N/A')}")
    logging.info(f"   Task instance: {context.get('task_instance_key_str', 'N/A')}")


def log_task_complete(task_name: str, **context) -> None:
    """タスク完了ログ"""
    logging.info(f"Completed task: {task_name}")
    logging.info(f"   Duration: {datetime.now().isoformat()}")


def store_task_result(task_instance, key: str, value: Any) -> None:
    """タスク結果をXComに保存"""
    task_instance.xcom_push(key=key, value=value)
    logging.info(f"Stored result in XCom: {key}")


def get_task_result(task_instance, task_ids: str, key: str) -> Any:
    """XComからタスク結果を取得"""
    result = task_instance.xcom_pull(task_ids=task_ids, key=key)
    logging.info(f"Retrieved from XCom: {key} from {task_ids}")
    return result


def log_database_stats(stats: Dict) -> None:
    """データベース統計情報ログ"""
    logging.info("Database Statistics:")
    for key, value in stats.items():
        logging.info(f"   {key}: {value}")


def create_task_summary(task_name: str, results: Dict) -> Dict:
    """タスクサマリー作成"""
    return {
        "task_name": task_name,
        "completion_time": datetime.now().isoformat(),
        "results": results,
        "status": "success",
    }
