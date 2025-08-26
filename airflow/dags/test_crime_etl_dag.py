"""
簡易版犯罪ETL DAG - 動作テスト用

依存関係を最小化した犯罪データETL DAGのテスト版。
基本的な機能のみを実装して動作確認を行います。
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.trigger_rule import TriggerRule
from datetime import datetime, timedelta

# 基本設定
DEFAULT_ARGS = {
    "owner": "tokyo-etl",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}


def test_crime_download(**context):
    """テスト用犯罪データダウンロード"""
    import logging

    logging.info("Testing crime data download...")

    # モックデータ作成
    mock_data = [
        {
            "crime_type": "侵入窃盗",
            "occurrence_datetime": "2024-01-15 10:30:00",
            "latitude": 35.7148,
            "longitude": 139.7967,
            "ward_code": "13106",
        },
        {
            "crime_type": "路上強盗",
            "occurrence_datetime": "2024-01-16 22:15:00",
            "latitude": 35.7089,
            "longitude": 139.7624,
            "ward_code": "13105",
        },
    ]

    # XComで結果を渡す
    context["task_instance"].xcom_push(key="crime_data", value=mock_data)

    logging.info(f"Crime download test complete: {len(mock_data)} records")
    return f"Downloaded {len(mock_data)} crime records"


def test_crime_transform(**context):
    """テスト用犯罪データ変換"""
    import logging

    logging.info("Testing crime data transformation...")

    # 前タスクからデータ取得
    crime_data = context["task_instance"].xcom_pull(
        task_ids="test_download_crime", key="crime_data"
    )

    if not crime_data:
        raise ValueError("No crime data received from download task")

    # 簡単な変換処理
    transformed_data = []
    for record in crime_data:
        transformed_record = {
            **record,
            "processed_at": datetime.now().isoformat(),
            "data_source": "test_mock",
        }
        transformed_data.append(transformed_record)

    # XComで結果を渡す
    context["task_instance"].xcom_push(key="transformed_data", value=transformed_data)

    logging.info(f"Crime transform test complete: {len(transformed_data)} records")
    return f"Transformed {len(transformed_data)} records"


def test_crime_load(**context):
    """テスト用犯罪データロード"""
    import logging

    logging.info("Testing crime data loading...")

    # 前タスクからデータ取得
    transformed_data = context["task_instance"].xcom_pull(
        task_ids="test_transform_crime", key="transformed_data"
    )

    if not transformed_data:
        raise ValueError("No transformed data received")

    # ダミーロード処理
    load_stats = {
        "loaded_records": len(transformed_data),
        "ward_breakdown": {},
        "load_time": datetime.now().isoformat(),
    }

    # 区別統計
    for record in transformed_data:
        ward = record.get("ward_code", "unknown")
        load_stats["ward_breakdown"][ward] = (
            load_stats["ward_breakdown"].get(ward, 0) + 1
        )

    # XComで結果を渡す
    context["task_instance"].xcom_push(key="load_stats", value=load_stats)

    logging.info(f"Crime load test complete: {load_stats}")
    return f"Loaded {load_stats['loaded_records']} records"


def test_completion_notification(**context):
    """テスト用完了通知"""
    import logging

    logging.info("📢 Testing completion notification...")

    # 前タスクの結果取得
    load_stats = context["task_instance"].xcom_pull(
        task_ids="test_load_crime", key="load_stats"
    )

    report = f"""
🎉 Test Crime ETL Complete!

Execution: {context.get("ds", "Unknown")}
Records Processed: {load_stats.get("loaded_records", 0)}
Ward Breakdown: {load_stats.get("ward_breakdown", {})}

Status: SUCCESS 
    """

    logging.info("Test ETL Completion Report:")
    for line in report.strip().split("\n"):
        logging.info(line)

    return "Notification sent successfully"


# DAG定義
dag = DAG(
    "test_crime_etl",
    default_args=DEFAULT_ARGS,
    description="Crime ETL Test Pipeline - Simplified Version",
    schedule_interval=None,  # 手動実行のみ
    start_date=datetime(2024, 1, 1),
    max_active_runs=1,
    tags=["test", "crime", "etl"],
    catchup=False,
)

# タスク定義
download_task = PythonOperator(
    task_id="test_download_crime",
    python_callable=test_crime_download,
    dag=dag,
)

transform_task = PythonOperator(
    task_id="test_transform_crime",
    python_callable=test_crime_transform,
    dag=dag,
)

load_task = PythonOperator(
    task_id="test_load_crime",
    python_callable=test_crime_load,
    dag=dag,
)

notification_task = PythonOperator(
    task_id="test_completion_notification",
    python_callable=test_completion_notification,
    trigger_rule=TriggerRule.ALL_SUCCESS,
    dag=dag,
)

# タスク依存関係
download_task >> transform_task >> load_task >> notification_task

# DAGドキュメント
dag.doc_md = """
# テスト用犯罪ETL DAG

## 目的
新しい分離DAG実装の動作確認用テストDAG。
複雑な依存関係を避けて基本的なETLフローをテストします。

## テスト内容
1. **モックデータダウンロード**: 台東区・文京区の犯罪データ
2. **データ変換**: タイムスタンプ付与
3. **ダミーロード**: 統計情報生成
4. **完了通知**: レポート出力

## 実行方法
```bash
make airflow-run-dag DAG_ID=test_crime_etl
```

## 確認項目
- DAGパース正常性
- タスクチェーン実行
- XCom データ受け渡し
- ログ出力
"""
