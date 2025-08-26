"""
Data Validation Utilities

犯罪データ・学校データの品質チェック機能。
ダウンロード後のデータ整合性検証とクリーニングを提供します。
"""

import pandas as pd
import logging
from typing import Dict, List


def validate_crime_data(file_paths: List[str]) -> Dict:
    """
    犯罪データの品質チェック

    Args:
        file_paths: チェック対象ファイルパスのリスト

    Returns:
        品質チェック結果辞書
    """
    logging.info(f"Starting crime data validation for {len(file_paths)} files")

    results = {
        "total_files": len(file_paths),
        "valid_files": 0,
        "total_records": 0,
        "valid_records": 0,
        "quality_issues": [],
        "score": 0.0,
    }

    for file_path in file_paths:
        try:
            file_result = _validate_single_crime_file(file_path)
            results["valid_files"] += file_result["is_valid"]
            results["total_records"] += file_result["total_records"]
            results["valid_records"] += file_result["valid_records"]
            results["quality_issues"].extend(file_result["issues"])

        except Exception as e:
            error_msg = f"Failed to validate {file_path}: {str(e)}"
            results["quality_issues"].append(error_msg)
            logging.error(f"{error_msg}")

    # 品質スコア計算
    if results["total_records"] > 0:
        record_quality = results["valid_records"] / results["total_records"]
        file_quality = (
            results["valid_files"] / results["total_files"]
            if results["total_files"] > 0
            else 0
        )
        results["score"] = (record_quality * 0.7 + file_quality * 0.3) * 100

    logging.info(
        f"📊 Crime data validation complete: {results['score']:.1f}% quality score"
    )
    return results


def validate_school_data(file_paths: List[str]) -> Dict:
    """
    学校データの品質チェック

    Args:
        file_paths: チェック対象ファイルパスのリスト

    Returns:
        品質チェック結果辞書
    """
    logging.info(f"Starting school data validation for {len(file_paths)} files")

    results = {
        "total_files": len(file_paths),
        "valid_files": 0,
        "total_records": 0,
        "valid_records": 0,
        "quality_issues": [],
        "score": 0.0,
    }

    for file_path in file_paths:
        try:
            file_result = _validate_single_school_file(file_path)
            results["valid_files"] += file_result["is_valid"]
            results["total_records"] += file_result["total_records"]
            results["valid_records"] += file_result["valid_records"]
            results["quality_issues"].extend(file_result["issues"])

        except Exception as e:
            error_msg = f"Failed to validate {file_path}: {str(e)}"
            results["quality_issues"].append(error_msg)
            logging.error(f"{error_msg}")

    # 品質スコア計算
    if results["total_records"] > 0:
        record_quality = results["valid_records"] / results["total_records"]
        file_quality = (
            results["valid_files"] / results["total_files"]
            if results["total_files"] > 0
            else 0
        )
        results["score"] = (record_quality * 0.7 + file_quality * 0.3) * 100

    logging.info(
        f"📊 School data validation complete: {results['score']:.1f}% quality score"
    )
    return results


def _validate_single_crime_file(file_path: str) -> Dict:
    """
    単一犯罪データファイルの品質チェック
    """
    issues = []

    # ファイル読み込み
    try:
        df = pd.read_csv(file_path, encoding="shift_jis")
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(file_path, encoding="utf-8")
        except Exception as e:
            return {
                "is_valid": False,
                "total_records": 0,
                "valid_records": 0,
                "issues": [f"Failed to read file {file_path}: {str(e)}"],
            }

    total_records = len(df)
    valid_records = 0

    # 必須列チェック
    required_columns = ["事件種別", "発生日時", "緯度", "経度"]
    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        issues.append(f"Missing required columns: {missing_columns}")
        return {
            "is_valid": False,
            "total_records": total_records,
            "valid_records": 0,
            "issues": issues,
        }

    # レコードレベルの検証
    for index, row in df.iterrows():
        record_valid = True

        # 座標範囲チェック（東京23区周辺）
        if not (35.5 <= row["緯度"] <= 35.9 and 139.3 <= row["経度"] <= 139.9):
            record_valid = False

        # 事件種別チェック
        if pd.isna(row["事件種別"]) or str(row["事件種別"]).strip() == "":
            record_valid = False

        # 日時チェック
        try:
            pd.to_datetime(row["発生日時"])
        except (ValueError, TypeError, pd.errors.ParserError):
            record_valid = False

        if record_valid:
            valid_records += 1

    # 品質問題の記録
    if valid_records < total_records * 0.8:
        issues.append(
            f"Low record quality: {valid_records}/{total_records} valid records"
        )

    return {
        "is_valid": len(issues) == 0 and valid_records > 0,
        "total_records": total_records,
        "valid_records": valid_records,
        "issues": issues,
    }


def _validate_single_school_file(file_path: str) -> Dict:
    """
    単一学校データファイルの品質チェック
    """
    issues = []

    # ファイル読み込み
    try:
        df = pd.read_csv(file_path, encoding="utf-8")
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(file_path, encoding="shift_jis")
        except Exception as e:
            return {
                "is_valid": False,
                "total_records": 0,
                "valid_records": 0,
                "issues": [f"Failed to read file {file_path}: {str(e)}"],
            }

    total_records = len(df)
    valid_records = 0

    # 必須列チェック
    required_columns = ["学校名", "学校種別", "緯度", "経度"]
    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        issues.append(f"Missing required columns: {missing_columns}")
        return {
            "is_valid": False,
            "total_records": total_records,
            "valid_records": 0,
            "issues": issues,
        }

    # レコードレベルの検証
    for index, row in df.iterrows():
        record_valid = True

        # 座標範囲チェック（東京23区周辺）
        if not (35.5 <= row["緯度"] <= 35.9 and 139.3 <= row["経度"] <= 139.9):
            record_valid = False

        # 学校名チェック
        if pd.isna(row["学校名"]) or str(row["学校名"]).strip() == "":
            record_valid = False

        # 学校種別チェック
        valid_school_types = ["小学校", "中学校", "高等学校", "高校"]
        if str(row["学校種別"]) not in valid_school_types:
            record_valid = False

        if record_valid:
            valid_records += 1

    # 品質問題の記録
    if valid_records < total_records * 0.8:
        issues.append(
            f"Low record quality: {valid_records}/{total_records} valid records"
        )

    return {
        "is_valid": len(issues) == 0 and valid_records > 0,
        "total_records": total_records,
        "valid_records": valid_records,
        "issues": issues,
    }


def check_coordinate_accuracy(df: pd.DataFrame, lat_col: str, lng_col: str) -> Dict:
    """
    座標精度チェック

    Args:
        df: データフレーム
        lat_col: 緯度列名
        lng_col: 経度列名

    Returns:
        座標精度チェック結果
    """
    results = {
        "total_coordinates": len(df),
        "valid_coordinates": 0,
        "precision_levels": {},
        "outliers": [],
    }

    for index, row in df.iterrows():
        lat, lng = row[lat_col], row[lng_col]

        # 有効性チェック
        if pd.notna(lat) and pd.notna(lng):
            if 35.0 <= lat <= 36.0 and 139.0 <= lng <= 140.0:
                results["valid_coordinates"] += 1

                # 精度レベル判定
                lat_str, lng_str = str(lat), str(lng)
                decimal_places = min(
                    len(lat_str.split(".")[-1]) if "." in lat_str else 0,
                    len(lng_str.split(".")[-1]) if "." in lng_str else 0,
                )

                precision_key = f"{decimal_places}_digits"
                results["precision_levels"][precision_key] = (
                    results["precision_levels"].get(precision_key, 0) + 1
                )
            else:
                results["outliers"].append(
                    {
                        "index": index,
                        "lat": lat,
                        "lng": lng,
                        "reason": "outside_tokyo_area",
                    }
                )

    return results


def validate_date_consistency(df: pd.DataFrame, date_col: str) -> Dict:
    """
    日付データの一貫性チェック

    Args:
        df: データフレーム
        date_col: 日付列名

    Returns:
        日付チェック結果
    """
    results = {
        "total_dates": len(df),
        "valid_dates": 0,
        "date_range": {},
        "format_issues": [],
    }

    valid_dates = []

    for index, row in df.iterrows():
        date_value = row[date_col]

        try:
            parsed_date = pd.to_datetime(date_value)
            valid_dates.append(parsed_date)
            results["valid_dates"] += 1
        except (ValueError, TypeError, pd.errors.ParserError):
            results["format_issues"].append(
                {"index": index, "value": date_value, "issue": "unparseable_date"}
            )

    if valid_dates:
        results["date_range"] = {
            "earliest": min(valid_dates).isoformat(),
            "latest": max(valid_dates).isoformat(),
            "span_days": (max(valid_dates) - min(valid_dates)).days,
        }

    return results


def generate_data_quality_report(validation_results: Dict, data_type: str) -> str:
    """
    データ品質レポートの生成

    Args:
        validation_results: 品質チェック結果
        data_type: データタイプ

    Returns:
        品質レポート（テキスト形式）
    """
    report = f"""
📊 {data_type.upper()} DATA QUALITY REPORT

Overall Quality Score: {validation_results["score"]:.1f}%

File Statistics:
• Total Files: {validation_results["total_files"]}
• Valid Files: {validation_results["valid_files"]}
• File Success Rate: {(validation_results["valid_files"] / validation_results["total_files"] * 100):.1f}%

Record Statistics:
• Total Records: {validation_results["total_records"]:,}
• Valid Records: {validation_results["valid_records"]:,}
• Record Success Rate: {(validation_results["valid_records"] / validation_results["total_records"] * 100 if validation_results["total_records"] > 0 else 0):.1f}%

Quality Issues:
"""

    if validation_results["quality_issues"]:
        for i, issue in enumerate(validation_results["quality_issues"][:10], 1):
            report += f"• {issue}\n"

        if len(validation_results["quality_issues"]) > 10:
            report += f"... and {len(validation_results['quality_issues']) - 10} more issues\n"
    else:
        report += "• No significant quality issues detected ✅\n"

    report += f"\nGenerated: {pd.Timestamp.now().isoformat()}"

    return report.strip()
