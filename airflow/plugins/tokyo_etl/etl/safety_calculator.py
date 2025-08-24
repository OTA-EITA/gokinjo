"""Safety Score Calculation Functions"""

import logging
from typing import Dict, List
from tokyo_etl.core.database import get_app_db_connection
from tokyo_etl.config.settings import SAFETY_SCORE_CONFIG


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
