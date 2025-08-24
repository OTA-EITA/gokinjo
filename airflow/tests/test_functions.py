"""
Test ETL Functions Independently
関数単体テスト用スクリプト

Usage:
cd /Users/ota-eita/Documents/work/gokinjo/airflow
python tests/test_functions.py
"""

import sys

# Tokyo ETL パッケージのパス追加
sys.path.append("/Users/ota-eita/Documents/work/gokinjo/airflow/plugins")

try:
    from tokyo_etl.config.wards import TOKYO_WARDS
    from tokyo_etl.config.settings import SAFETY_SCORE_CONFIG
    from tokyo_etl.core.file_ops import get_priority_2_sql_file
    from tokyo_etl.etl.safety_calculator import get_safety_level
    from tokyo_etl.utils.notification import create_completion_report

    print("All imports successful!")

    # 設定テスト
    print(f"Tokyo wards loaded: {len(TOKYO_WARDS)} wards")
    print(f"Safety config: {SAFETY_SCORE_CONFIG['radius_meters']}m radius")

    # ファイル操作テスト
    sql_file = get_priority_2_sql_file()
    print(f"SQL file path: {sql_file}")

    # 安全レベルテスト
    print(f"Safety level test: {get_safety_level(95)} (score 95)")

    # レポートテスト
    mock_summary = {"total_schools": 28, "total_crimes": 69}
    mock_scores = [{"school_name": "Test School", "safety_score": 85}]
    report = create_completion_report(
        "2025-08-24", "test_run", mock_summary, mock_scores
    )
    print(f"Report generated: {len(report)} characters")

    print("\nAll function tests passed! Ready for Airflow integration.")

except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure you're running from the airflow directory")
except Exception as e:
    print(f"Test error: {e}")
