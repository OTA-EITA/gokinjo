"""
犯罪データETL専用DAG

警視庁オープンデータの月次更新に特化したETLパイプライン。
設計書通りの分離DAG実装：犯罪データのダウンロード・変換・ロード・安全スコア再計算を実行。

スケジュール: 毎月5日午前3時実行（警視庁データ更新に合わせて）
依存関係: download → transform → load → safety_recalc → notification
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.trigger_rule import TriggerRule

# 設定と専用プロセッサーをインポート
from tokyo_etl.config.settings import DEFAULT_ARGS
from tokyo_etl.etl.crime_processors import (
    download_crime_data_task,
    transform_crime_data_task,
    load_crime_to_postgis_task,
)
from tokyo_etl.etl.safety_calculator import recalculate_all_safety_scores_task
from tokyo_etl.utils.notification import send_crime_completion_notification_task

# ========== DAG定義 ==========

dag = DAG(
    "tokyo_crime_etl",
    default_args=DEFAULT_ARGS,
    description="Tokyo Crime Data ETL Pipeline - Monthly Updates",
    schedule_interval="0 3 5 * *",  # 毎月5日午前3時
    max_active_runs=1,
    concurrency=4,
    tags=["tokyo", "crime", "monthly", "postgis"],
    catchup=False,  # 過去の実行を補完しない
)

# ========== タスク定義 ==========

# Task 1: 犯罪データダウンロード
download_task = PythonOperator(
    task_id="download_crime_data",
    python_callable=download_crime_data_task,
    dag=dag,
    doc_md="""
    警視庁オープンデータCSV取得
    
    - データソース: 警視庁統計データ
    - 形式: CSV (Shift_JIS)
    - 頻度: 月次更新
    - バリデーション: データ品質チェック実施
    """,
)

# Task 2: 犯罪データ変換・正規化
transform_task = PythonOperator(
    task_id="transform_crime_data",
    python_callable=transform_crime_data_task,
    dag=dag,
    doc_md="""
    犯罪データ変換・正規化
    
    - 列名統一: crime_type, location, date
    - 座標変換: WGS84統一
    - エラーレコード除去
    - 区コード正規化
    - 出力: Parquet形式
    """,
)

# Task 3: PostGISロード
load_task = PythonOperator(
    task_id="load_crime_to_postgis",
    python_callable=load_crime_to_postgis_task,
    dag=dag,
    doc_md="""
    犯罪データをPostGISにロード
    
    - 戦略: UPSERT（重複回避）
    - インデックス: 空間インデックス自動更新
    - テーブル: crimes
    """,
)

# Task 4: 全学校安全スコア再計算
safety_task = PythonOperator(
    task_id="recalculate_safety_scores",
    python_callable=recalculate_all_safety_scores_task,
    dag=dag,
    doc_md="""
    全学校の安全スコア再計算
    
    - アルゴリズム: 半径500m以内犯罪件数集計
    - 計算式: 100 - (件数 × 10)
    - 更新対象: schools.safety_score
    """,
)

# Task 5: 完了通知
notification_task = PythonOperator(
    task_id="crime_completion_notification",
    python_callable=send_crime_completion_notification_task,
    trigger_rule=TriggerRule.ALL_SUCCESS,
    dag=dag,
    doc_md="""
    犯罪ETL完了通知
    
    - レポート内容: 新規件数、更新件数、異常値検出結果
    - 通知先: 管理者メール・Slack
    """,
)

# ========== タスク依存関係 ==========

download_task >> transform_task >> load_task >> safety_task >> notification_task

# ========== DAGドキュメント ==========

dag.doc_md = """
# 犯罪データETL専用DAG

## 概要
警視庁オープンデータの月次更新に特化したETLパイプライン。
設計書通りの分離DAG実装により、犯罪データ更新と学校データ更新を独立実行。

## 実行スケジュール
- **頻度**: 月次実行
- **タイミング**: 毎月5日午前3時
- **理由**: 警視庁データ更新タイミングに合わせて最適化

## データフロー
1. **download_crime_data**: 警視庁オープンデータCSV取得
2. **transform_crime_data**: データ変換・正規化・Parquet保存
3. **load_crime_to_postgis**: PostGISへのUPSERT実行
4. **recalculate_safety_scores**: 全学校安全スコア再計算
5. **crime_completion_notification**: 処理完了通知

## 設計上の利点
- **エラー隔離**: 学校データエラーの影響を受けない
- **リソース最適化**: 犯罪データ専用のリソース配分
- **独立監視**: 犯罪データ特有のアラート設定
- **選択的再実行**: 犯罪データのみ再処理可能

## 次ステップとの連携
- **Phase 3b**: 警視庁API連携
- **Phase 3c**: 新区データ拡張対応
- **Phase 4**: Kubernetes Executor移行準備
"""

# タスクドキュメント設定
download_task.doc = (
    "警視庁オープンデータCSV取得（crime_processors.download_crime_data_task）"
)
transform_task.doc = (
    "犯罪データ変換・正規化（crime_processors.transform_crime_data_task）"
)
load_task.doc = "PostGISロード（crime_processors.load_crime_to_postgis_task）"
safety_task.doc = (
    "安全スコア再計算（safety_calculator.recalculate_all_safety_scores_task）"
)
notification_task.doc = (
    "完了通知（notification.send_crime_completion_notification_task）"
)
