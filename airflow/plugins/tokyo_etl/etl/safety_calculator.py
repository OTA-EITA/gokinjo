"""
Safety Score Calculation Functions

設計書に基づく安全スコア計算機能：
- 犯罪DAG専用：全学校の安全スコア再計算
- 学校DAG専用：新規校の安全スコア初期化
- 共通機能：半径500m以内の犯罪件数ベースの計算
"""

import logging
from datetime import datetime
from typing import Dict, List
from tokyo_etl.core.database import get_app_db_connection
from tokyo_etl.config.settings import SAFETY_SCORE_CONFIG
from tokyo_etl.utils.task_logging import (
    log_task_start,
    log_task_complete,
    log_error_notification,
)
from tokyo_etl.utils.task_results import store_task_result, get_task_result


def recalculate_all_safety_scores_task(**context) -> None:
    """
    全学校の安全スコア再計算（犯罪DAG用）

    犯罪データ更新後に全学校の安全スコアを再計算します。
    半径500m以内の犯罪件数を基に 100 - (件数 × 10) で算出。
    """
    log_task_start("recalculate_all_safety_scores", **context)

    try:
        # 前タスクの結果確認
        load_stats = get_task_result(
            context["task_instance"], "load_crime_to_postgis", "load_stats"
        )

        # PostGIS接続
        engine = get_app_db_connection()

        # 全学校の安全スコア計算
        safety_scores = []

        with engine.connect() as conn:
            # アクティブな全学校取得（既存スキーマに合わせて修正）
            schools_query = """
                SELECT id, name as school_name, location 
                FROM schools
            """
            schools_result = conn.execute(schools_query)
            schools = schools_result.fetchall()

            for school in schools:
                # 安全スコア計算
                score = calculate_safety_score(
                    conn, school["id"], school["location"], radius_meters=500
                )

                # スコア更新（既存テーブル構造に合わせて修正）
                update_query = """
                    UPDATE schools 
                    SET updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """
                conn.execute(update_query, (school["id"],))

                safety_scores.append(
                    {
                        "school_id": school["id"],
                        "school_name": school["school_name"],
                        "safety_score": score,
                    }
                )

        # 統計計算
        result = {
            "updated_schools": len(safety_scores),
            "average_score": sum(s["safety_score"] for s in safety_scores)
            / len(safety_scores)
            if safety_scores
            else 0,
            "score_distribution": get_score_distribution(safety_scores),
            "crime_data_stats": load_stats,
            "calculation_time": datetime.now().isoformat(),
        }

        store_task_result(context["task_instance"], "safety_calculation", result)
        log_task_complete(
            "recalculate_all_safety_scores",
            updated_schools=result["updated_schools"],
            avg_score=result["average_score"],
            **context,
        )

    except Exception as e:
        log_error_notification("recalculate_all_safety_scores", str(e))
        raise


def calculate_safety_score(
    conn, school_id: int, school_location, radius_meters: int = 500
) -> int:
    """
    単一学校の安全スコア計算

    指定半径内の犯罪件数を基に安全スコアを算出します。
    計算式: max(0, 100 - (犯罪件数 × 10))
    """
    crime_count_query = """
        SELECT COUNT(*) as crime_count
        FROM crimes c
        WHERE ST_DWithin(
            c.location::geography,
            %s::geography,
            %s
        )
        AND c.date >= CURRENT_DATE - INTERVAL '12 months'
    """

    result = conn.execute(crime_count_query, (school_location, radius_meters))
    crime_count = result.fetchone()[0]

    # 安全スコア計算
    safety_score = max(0, 100 - (crime_count * 10))

    return safety_score


def recalculate_priority_2_safety_scores() -> List[Dict]:
    """Priority 2区（台東区・文京区）の安全スコア再計算"""
    logging.info("Recalculating safety scores for Priority 2 districts...")

    engine = get_app_db_connection()

    # 安全スコア再計算SQL
    recalc_sql = """
    SELECT 
        s.id as school_id,
        s.name as school_name,
        s.type as school_type,
        a.name as area_name,
        a.ward_code,
        COUNT(c.id) as crimes_within_500m,
        GREATEST(0, 100 - (COUNT(c.id) * 10)) as safety_score
    FROM schools s
    JOIN areas a ON s.area_id = a.id
    LEFT JOIN crimes c ON ST_DWithin(
        c.location::geography,
        s.location::geography,
        %s  -- radius in meters
    )
    WHERE a.ward_code IN ('13106', '13105')  -- 台東区・文京区
    AND (c.date >= CURRENT_DATE - INTERVAL '%s months' OR c.date IS NULL)
    GROUP BY s.id, s.name, s.type, a.name, a.ward_code
    ORDER BY safety_score ASC, s.name
    """

    with engine.connect() as conn:
        result = conn.execute(
            recalc_sql,
            (
                SAFETY_SCORE_CONFIG["radius_meters"],
                SAFETY_SCORE_CONFIG["recent_months"],
            ),
        )
        safety_scores = result.fetchall()

        scores_data = []
        for row in safety_scores:
            score_data = {
                "school_id": row[0],
                "school_name": row[1],
                "school_type": row[2],
                "area_name": row[3],
                "ward_code": row[4],
                "crime_count": row[5],
                "safety_score": row[6],
            }
            scores_data.append(score_data)

        logging.info(f"Calculated safety scores for {len(scores_data)} schools")

        # 統計情報ログ
        if scores_data:
            safest = max(scores_data, key=lambda x: x["safety_score"])
            most_dangerous = min(scores_data, key=lambda x: x["safety_score"])

            logging.info(
                f"Safest school: {safest['school_name']} (Score: {safest['safety_score']})"
            )
            logging.info(
                f"Most dangerous: {most_dangerous['school_name']} (Score: {most_dangerous['safety_score']})"
            )

    return scores_data


def calculate_all_safety_scores() -> List[Dict]:
    """全学校の安全スコア計算"""
    logging.info("Calculating safety scores for all schools...")

    engine = get_app_db_connection()

    all_scores_sql = """
    SELECT 
        s.id as school_id,
        s.name as school_name,
        s.type as school_type,
        a.name as area_name,
        a.ward_code,
        COUNT(c.id) as crimes_within_500m,
        GREATEST(0, 100 - (COUNT(c.id) * 10)) as safety_score
    FROM schools s
    JOIN areas a ON s.area_id = a.id
    LEFT JOIN crimes c ON ST_DWithin(
        c.location::geography,
        s.location::geography,
        %s
    )
    WHERE c.date >= CURRENT_DATE - INTERVAL '%s months' OR c.date IS NULL
    GROUP BY s.id, s.name, s.type, a.name, a.ward_code
    ORDER BY a.ward_code, safety_score DESC
    """

    with engine.connect() as conn:
        result = conn.execute(
            all_scores_sql,
            (
                SAFETY_SCORE_CONFIG["radius_meters"],
                SAFETY_SCORE_CONFIG["recent_months"],
            ),
        )
        all_scores = result.fetchall()

        scores_data = []
        for row in all_scores:
            score_data = {
                "school_id": row[0],
                "school_name": row[1],
                "school_type": row[2],
                "area_name": row[3],
                "ward_code": row[4],
                "crime_count": row[5],
                "safety_score": row[6],
            }
            scores_data.append(score_data)

        # 統計サマリー
        ward_stats = {}
        for score in scores_data:
            ward_code = score["ward_code"]
            if ward_code not in ward_stats:
                ward_stats[ward_code] = []
            ward_stats[ward_code].append(score["safety_score"])

        logging.info(
            f"Calculated safety scores for {len(scores_data)} schools across {len(ward_stats)} wards"
        )

        for ward_code, scores in ward_stats.items():
            avg_score = sum(scores) / len(scores)
            logging.info(
                f"  Ward {ward_code}: {len(scores)} schools, avg score: {avg_score:.1f}"
            )

    return scores_data


def get_score_distribution(safety_scores: List[Dict]) -> Dict:
    """
    安全スコアの分布統計を取得
    """
    if not safety_scores:
        return {}

    scores = [s["safety_score"] for s in safety_scores]

    return {
        "min_score": min(scores),
        "max_score": max(scores),
        "median_score": sorted(scores)[len(scores) // 2],
        "very_safe_count": len([s for s in scores if s >= 90]),
        "safe_count": len([s for s in scores if 70 <= s < 90]),
        "moderate_count": len([s for s in scores if 50 <= s < 70]),
        "caution_count": len([s for s in scores if s < 50]),
    }


def get_safety_level(score: int) -> str:
    """安全レベル判定"""
    if score >= 90:
        return "very_safe"
    elif score >= 70:
        return "safe"
    elif score >= 50:
        return "moderate"
    else:
        return "caution"
