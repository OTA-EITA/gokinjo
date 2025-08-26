"""
学校データETL専用DAG

東京都教育委員会オープンデータの年次更新に特化したETLパイプライン。
設計書通りの分離DAG実装：学校データのダウンロード・変換・同期を実行。

スケジュール: 毎年4月5日午前2時実行（新年度開始に合わせて）
依存関係: download → transform → sync → notification
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.trigger_rule import TriggerRule

# 設定と専用プロセッサーをインポート
from tokyo_etl.config.settings import DEFAULT_ARGS
from tokyo_etl.etl.school_processors import (
    download_school_data_task,
    transform_school_data_task,
    sync_school_to_postgis_task,
)
from tokyo_etl.utils.notification import send_school_completion_notification_task

# ========== DAG定義 ==========

dag = DAG(
    "tokyo_school_etl",
    default_args=DEFAULT_ARGS,
    description="Tokyo School Data ETL Pipeline - Yearly Updates",
    schedule_interval="0 2 5 4 *",  # 毎年4月5日午前2時
    max_active_runs=1,
    concurrency=2,  # 学校データは犯罪データより軽量
    tags=["tokyo", "school", "yearly", "education"],
    catchup=False,  # 過去の実行を補完しない
)

# ========== タスク定義 ==========

# Task 1: 学校データダウンロード
download_task = PythonOperator(
    task_id="download_school_data",
    python_callable=download_school_data_task,
    dag=dag,
    doc_md="""
    東京都教育委員会データ取得
    
    - データソース: 東京都オープンデータカタログ（学校関連）
    - 形式: CSV (UTF-8)
    - 頻度: 年次更新
    - バリデーション: 学校名・座標・種別チェック
    """,
)

# Task 2: 学校データ変換・正規化
transform_task = PythonOperator(
    task_id="transform_school_data",
    python_callable=transform_school_data_task,
    dag=dag,
    doc_md="""
    学校データ変換・正規化
    
    - 緯度経度検証・補正
    - 学校種別正規化: elementary/junior_high/high
    - 公立私立区分統一
    - 住所正規化
    - 出力: Parquet形式
    """,
)

# Task 3: PostGIS同期（統廃合対応）
sync_task = PythonOperator(
    task_id="sync_school_to_postgis",
    python_callable=sync_school_to_postgis_task,
    dag=dag,
    doc_md="""
    学校データをPostGISに同期
    
    - 戦略: MERGE（統廃合対応）
    - 操作: 新規学校追加、閉校学校削除、情報更新
    - 安全スコア: 新規校のみ初期化
    """,
)

# Task 4: 完了通知
notification_task = PythonOperator(
    task_id="school_completion_notification",
    python_callable=send_school_completion_notification_task,
    trigger_rule=TriggerRule.ALL_SUCCESS,
    dag=dag,
    doc_md="""
    学校ETL完了通知
    
    - レポート内容: 新規校数、統廃合情報、データ品質レポート
    - 通知先: 管理者メール・Slack
    """,
)

# ========== タスク依存関係 ==========

download_task >> transform_task >> sync_task >> notification_task

# ========== DAGドキュメント ==========

dag.doc_md = """
# 学校データETL専用DAG

## 概要
東京都教育委員会オープンデータの年次更新に特化したETLパイプライン。
設計書通りの分離DAG実装により、学校データ更新と犯罪データ更新を独立実行。

## 実行スケジュール
- **頻度**: 年次実行
- **タイミング**: 毎年4月5日午前2時
- **理由**: 新年度開始に合わせて学校情報更新を実施

## データフロー
1. **download_school_data**: 東京都教育委員会オープンデータCSV取得
2. **transform_school_data**: データ変換・正規化・Parquet保存
3. **sync_school_to_postgis**: PostGISへのMERGE実行（統廃合対応）
4. **school_completion_notification**: 処理完了通知

## 統廃合対応機能
- **新規学校**: 自動追加 + 安全スコア初期化
- **情報更新**: 既存学校データの更新
- **閉校処理**: 非アクティブ化（削除ではなく履歴保持）

## 設計上の利点
- **頻度最適化**: 年次更新で無駄な処理を削減
- **統廃合対応**: 学校の新設・廃校を適切に処理
- **独立実行**: 犯罪データエラーの影響を受けない
- **データ品質**: 学校データ特有のバリデーション

## 次ステップとの連携
- **Phase 3b**: 教育委員会API連携
- **Phase 3c**: 新区データ拡張対応
- **Phase 4**: Kubernetes Executor移行準備
"""

# タスクドキュメント設定
download_task.doc = (
    "東京都教育委員会データ取得（school_processors.download_school_data_task）"
)
transform_task.doc = (
    "学校データ変換・正規化（school_processors.transform_school_data_task）"
)
sync_task.doc = "PostGIS同期（school_processors.sync_school_to_postgis_task）"
notification_task.doc = (
    "完了通知（notification.send_school_completion_notification_task）"
)
