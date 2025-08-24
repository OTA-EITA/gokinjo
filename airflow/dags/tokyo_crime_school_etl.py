"""
近隣情報マッピングアプリ ETL自動化

このDAGは外部関数を呼び出すだけのシンプルな構成です。
すべてのロジックは tokyo_etl パッケージに分離されています。
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.trigger_rule import TriggerRule

# 設定とETL関数をインポート
from tokyo_etl.config.settings import DEFAULT_ARGS
from tokyo_etl.etl.processors import (
    download_raw_files_task,
    transform_priority_2_districts_task,
    normalize_to_parquet_task,
    load_to_postgis_task,
    recalculate_safety_scores_task,
    send_completion_notification_task,
)

# ========== DAG定義 ==========

dag = DAG(
    "tokyo_crime_school_etl",
    default_args=DEFAULT_ARGS,
    description="Tokyo Crime & School Data ETL Pipeline - Phase 2 (Function Separated)",
    schedule_interval="@daily",  # 毎日実行（開発中は手動実行推奨）
    max_active_runs=1,
    concurrency=4,
    tags=["tokyo", "crime", "school", "etl", "postgis"],
)

# ========== タスク定義（関数呼び出しのみ） ==========

# Task 1: データダウンロード
download_task = PythonOperator(
    task_id="download_raw_files", python_callable=download_raw_files_task, dag=dag
)

# Task 2: Priority 2地区データ変換
transform_task = PythonOperator(
    task_id="transform_priority_2_districts",
    python_callable=transform_priority_2_districts_task,
    dag=dag,
)

# Task 3: Parquet正規化
normalize_task = PythonOperator(
    task_id="normalize_to_parquet", python_callable=normalize_to_parquet_task, dag=dag
)

# Task 4: PostGISロード
load_task = PythonOperator(
    task_id="load_to_postgis", python_callable=load_to_postgis_task, dag=dag
)

# Task 5: 安全スコア再計算
safety_task = PythonOperator(
    task_id="recalculate_safety_scores",
    python_callable=recalculate_safety_scores_task,
    dag=dag,
)

# Task 6: 完了通知
notification_task = PythonOperator(
    task_id="send_completion_notification",
    python_callable=send_completion_notification_task,
    trigger_rule=TriggerRule.ALL_SUCCESS,
    dag=dag,
)

# ========== タスク依存関係 ==========

(
    download_task
    >> transform_task
    >> normalize_task
    >> load_task
    >> safety_task
    >> notification_task
)

# ========== DAGドキュメント ==========

dag.doc_md = __doc__

# タスクドキュメント
download_task.doc_md = "生データファイル監視・ダウンロード（tokyo_etl.etl.processors.download_raw_files_task）"
transform_task.doc_md = "台東区・文京区データ変換（tokyo_etl.etl.processors.transform_priority_2_districts_task）"
normalize_task.doc_md = (
    "Parquet正規化（tokyo_etl.etl.processors.normalize_to_parquet_task）"
)
load_task.doc_md = "PostGISロード（tokyo_etl.etl.processors.load_to_postgis_task）"
safety_task.doc_md = (
    "安全スコア再計算（tokyo_etl.etl.processors.recalculate_safety_scores_task）"
)
notification_task.doc_md = (
    "完了通知（tokyo_etl.etl.processors.send_completion_notification_task）"
)
