"""
統合版: 東京23区データETL自動化
Priority パラメータで処理対象を動的に変更
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.trigger_rule import TriggerRule
from datetime import datetime, timedelta

# 汎用処理関数をインポート
from tokyo_etl.etl.generic_district_processor import (
    process_districts_by_priority,
    verify_districts_by_priority
)

def create_district_etl_dag(priority: int):
    """Priority別のDAG生成関数"""
    
    dag_id = f"tokyo_districts_etl_priority_{priority}"
    description = f"Tokyo Districts ETL - Priority {priority}"
    
    dag = DAG(
        dag_id=dag_id,
        default_args={
            "owner": "gokinjo_team",
            "start_date": datetime(2024, 8, 26),
            "retries": 1,
            "retry_delay": timedelta(minutes=5),
        },
        description=description,
        schedule_interval=None,  # 手動実行
        max_active_runs=1,
        tags=["tokyo", "crime", "school", f"priority{priority}"],
    )
    
    # Priority別処理タスク
    process_task = PythonOperator(
        task_id=f"process_priority_{priority}_districts",
        python_callable=lambda **ctx: process_districts_by_priority(priority, **ctx),
        dag=dag,
    )
    
    # 検証タスク
    verify_task = PythonOperator(
        task_id=f"verify_priority_{priority}_data",
        python_callable=lambda **ctx: verify_districts_by_priority(priority, **ctx),
        dag=dag,
    )
    
    # 統計更新タスク
    update_stats_task = PythonOperator(
        task_id="update_statistics",
        python_callable=lambda **ctx: update_system_statistics(**ctx),
        trigger_rule=TriggerRule.ALL_SUCCESS,
        dag=dag,
    )
    
    # タスク依存関係
    process_task >> verify_task >> update_stats_task
    
    return dag

def update_system_statistics(**context):
    """システム統計更新"""
    print("システム統計を更新しました")
    return "statistics_updated"

# 各PriorityのDAGを生成
# Priority 3のみ有効化（墨田区テスト用）
# Priority 2, 4は将来のデータ追加時に有効化予定

# priority_2_dag = create_district_etl_dag(2)  # 将来有効化
priority_3_dag = create_district_etl_dag(3)  # 墨田区テスト用
# priority_4_dag = create_district_etl_dag(4)  # 将来有効化

# グローバル変数に登録（Airflowが認識するため）
# globals()["tokyo_districts_etl_priority_2"] = priority_2_dag  # 将来有効化
globals()["tokyo_districts_etl_priority_3"] = priority_3_dag
# globals()["tokyo_districts_etl_priority_4"] = priority_4_dag  # 将来有効化
