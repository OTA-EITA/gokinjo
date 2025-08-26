"""
Geographical Processing Utilities

座標変換・住所正規化・区コード追加などの地理的データ処理機能。
犯罪データ・学校データの位置情報処理を統一的に提供します。
"""

import pandas as pd
import logging
from typing import Dict, Tuple
import re


def convert_to_wgs84(
    df: pd.DataFrame, lat_col: str = "latitude", lng_col: str = "longitude"
) -> pd.DataFrame:
    """
    座標をWGS84形式に変換・検証

    Args:
        df: 対象データフレーム
        lat_col: 緯度列名
        lng_col: 経度列名

    Returns:
        変換後のデータフレーム
    """
    logging.info(f"Converting {len(df)} records to WGS84 coordinates")

    result_df = df.copy()
    conversion_stats = {"converted": 0, "already_valid": 0, "failed": 0}

    for index, row in result_df.iterrows():
        try:
            lat, lng = row[lat_col], row[lng_col]

            # 既にWGS84範囲内の場合
            if _is_valid_wgs84_tokyo(lat, lng):
                conversion_stats["already_valid"] += 1
                continue

            # 日本測地系からの変換を試行
            converted_lat, converted_lng = _convert_jgd2wgs84(lat, lng)

            if _is_valid_wgs84_tokyo(converted_lat, converted_lng):
                result_df.at[index, lat_col] = converted_lat
                result_df.at[index, lng_col] = converted_lng
                conversion_stats["converted"] += 1
            else:
                conversion_stats["failed"] += 1
                logging.warning(f"⚠️ Invalid coordinates after conversion: {lat}, {lng}")

        except Exception as e:
            conversion_stats["failed"] += 1
            logging.error(f"Conversion failed for row {index}: {str(e)}")

    logging.info(f"Coordinate conversion stats: {conversion_stats}")
    return result_df


def add_ward_codes(
    df: pd.DataFrame, lat_col: str = "latitude", lng_col: str = "longitude"
) -> pd.DataFrame:
    """
    座標から東京23区コードを追加

    Args:
        df: 対象データフレーム
        lat_col: 緯度列名
        lng_col: 経度列名

    Returns:
        区コード追加後のデータフレーム
    """
    logging.info(f"Adding ward codes for {len(df)} records")

    result_df = df.copy()
    result_df["ward_code"] = None
    ward_assignment_stats = {}

    for index, row in result_df.iterrows():
        try:
            lat, lng = row[lat_col], row[lng_col]
            ward_code = _determine_ward_code(lat, lng)

            if ward_code:
                result_df.at[index, "ward_code"] = ward_code
                ward_assignment_stats[ward_code] = (
                    ward_assignment_stats.get(ward_code, 0) + 1
                )
            else:
                result_df.at[index, "ward_code"] = "unknown"
                ward_assignment_stats["unknown"] = (
                    ward_assignment_stats.get("unknown", 0) + 1
                )

        except Exception as e:
            result_df.at[index, "ward_code"] = "error"
            logging.error(f"Ward code assignment failed for row {index}: {str(e)}")

    logging.info(f"Ward assignment stats: {ward_assignment_stats}")
    return result_df


def validate_and_correct_coordinates(
    df: pd.DataFrame, lat_col: str = "latitude", lng_col: str = "longitude"
) -> pd.DataFrame:
    """
    座標の検証と補正

    Args:
        df: 対象データフレーム
        lat_col: 緯度列名
        lng_col: 経度列名

    Returns:
        検証・補正後のデータフレーム
    """
    logging.info(f"🔧 Validating and correcting coordinates for {len(df)} records")

    result_df = df.copy()
    correction_stats = {"valid": 0, "corrected": 0, "invalid": 0}

    for index, row in result_df.iterrows():
        try:
            lat, lng = row[lat_col], row[lng_col]

            # 基本的な妥当性チェック
            if pd.isna(lat) or pd.isna(lng):
                correction_stats["invalid"] += 1
                continue

            # 東京周辺の妥当な範囲内かチェック
            if _is_valid_wgs84_tokyo(lat, lng):
                correction_stats["valid"] += 1
                continue

            # 小数点の問題を補正
            corrected_lat, corrected_lng = _correct_decimal_issues(lat, lng)

            if _is_valid_wgs84_tokyo(corrected_lat, corrected_lng):
                result_df.at[index, lat_col] = corrected_lat
                result_df.at[index, lng_col] = corrected_lng
                correction_stats["corrected"] += 1
            else:
                correction_stats["invalid"] += 1
                logging.warning(f"⚠️ Could not correct coordinates: {lat}, {lng}")

        except Exception as e:
            correction_stats["invalid"] += 1
            logging.error(f"Coordinate validation failed for row {index}: {str(e)}")

    logging.info(f"Coordinate validation stats: {correction_stats}")
    return result_df


def normalize_addresses(df: pd.DataFrame, address_col: str = "address") -> pd.DataFrame:
    """
    住所の正規化

    Args:
        df: 対象データフレーム
        address_col: 住所列名

    Returns:
        住所正規化後のデータフレーム
    """
    logging.info(f"🏠 Normalizing addresses for {len(df)} records")

    result_df = df.copy()
    normalization_stats = {"normalized": 0, "unchanged": 0, "failed": 0}

    for index, row in result_df.iterrows():
        try:
            original_address = row[address_col]

            if pd.isna(original_address):
                normalization_stats["failed"] += 1
                continue

            normalized_address = _normalize_single_address(str(original_address))

            if normalized_address != original_address:
                result_df.at[index, address_col] = normalized_address
                normalization_stats["normalized"] += 1
            else:
                normalization_stats["unchanged"] += 1

        except Exception as e:
            normalization_stats["failed"] += 1
            logging.error(f"Address normalization failed for row {index}: {str(e)}")

    logging.info(f"Address normalization stats: {normalization_stats}")
    return result_df


def _is_valid_wgs84_tokyo(lat: float, lng: float) -> bool:
    """
    東京23区周辺のWGS84座標妥当性チェック

    Args:
        lat: 緯度
        lng: 経度

    Returns:
        妥当性判定結果
    """
    try:
        # 東京23区の大まかな範囲
        return 35.5 <= float(lat) <= 35.9 and 139.3 <= float(lng) <= 139.9
    except (ValueError, TypeError):
        return False


def _convert_jgd2wgs84(lat: float, lng: float) -> Tuple[float, float]:
    """
    日本測地系からWGS84への座標変換

    Args:
        lat: 日本測地系緯度
        lng: 日本測地系経度

    Returns:
        WGS84座標のタプル (緯度, 経度)
    """
    # 簡易変換式（東京周辺）
    # 実際の運用では正確な変換ライブラリを使用
    try:
        lat_wgs84 = (
            float(lat) + 0.00010696 * float(lat) - 0.000017467 * float(lng) - 0.0046020
        )
        lng_wgs84 = (
            float(lng) + 0.000046047 * float(lat) + 0.000083049 * float(lng) - 0.010041
        )
        return lat_wgs84, lng_wgs84
    except (ValueError, TypeError):
        return lat, lng


def _correct_decimal_issues(lat: float, lng: float) -> Tuple[float, float]:
    """
    座標の小数点問題を補正

    Args:
        lat: 緯度
        lng: 経度

    Returns:
        補正後の座標タプル
    """
    try:
        # 度分秒が度に変換されていない場合の補正
        corrected_lat = float(lat)
        corrected_lng = float(lng)

        # 明らかに大きすぎる値（度分秒形式）の補正
        if corrected_lat > 100:
            # 度分秒から度への変換を試行
            corrected_lat = _dms_to_decimal(corrected_lat)

        if corrected_lng > 1000:
            corrected_lng = _dms_to_decimal(corrected_lng)

        return corrected_lat, corrected_lng

    except (ValueError, TypeError):
        return lat, lng


def _dms_to_decimal(dms_value: float) -> float:
    """
    度分秒形式から度形式への変換

    Args:
        dms_value: 度分秒値

    Returns:
        度形式の値
    """
    try:
        # 簡易的な変換（実際の度分秒パースは複雑）
        dms_str = str(int(dms_value))

        if len(dms_str) >= 6:
            degrees = int(dms_str[:-4])
            minutes = int(dms_str[-4:-2])
            seconds = int(dms_str[-2:])

            return degrees + minutes / 60.0 + seconds / 3600.0
        else:
            return float(dms_value)

    except (ValueError, TypeError):
        return float(dms_value)


def _determine_ward_code(lat: float, lng: float) -> str:
    """
    座標から東京23区コードを決定

    Args:
        lat: 緯度
        lng: 経度

    Returns:
        区コード（5桁）
    """
    # 簡易的な区域判定（実際は正確な境界データが必要）
    try:
        lat_f, lng_f = float(lat), float(lng)

        # Priority 2区の判定
        if 35.705 <= lat_f <= 35.725 and 139.770 <= lng_f <= 139.800:
            return "13106"  # 台東区
        elif 35.700 <= lat_f <= 35.720 and 139.750 <= lng_f <= 139.780:
            return "13105"  # 文京区

        # Priority 3区の判定（大まかな範囲）
        elif 35.690 <= lat_f <= 35.710 and 139.810 <= lng_f <= 139.840:
            return "13107"  # 墨田区
        elif 35.650 <= lat_f <= 35.690 and 139.780 <= lng_f <= 139.820:
            return "13108"  # 江東区
        elif 35.610 <= lat_f <= 35.650 and 139.720 <= lng_f <= 139.750:
            return "13109"  # 品川区
        elif 35.630 <= lat_f <= 35.670 and 139.680 <= lng_f <= 139.720:
            return "13110"  # 目黒区

        # その他の23区（大まかな判定）
        elif 35.670 <= lat_f <= 35.700 and 139.680 <= lng_f <= 139.720:
            return "13101"  # 千代田区
        elif 35.670 <= lat_f <= 35.700 and 139.720 <= lng_f <= 139.780:
            return "13103"  # 港区
        elif 35.650 <= lat_f <= 35.690 and 139.690 <= lng_f <= 139.730:
            return "13104"  # 新宿区
        elif 35.710 <= lat_f <= 35.750 and 139.740 <= lng_f <= 139.780:
            return "13111"  # 豊島区
        elif 35.720 <= lat_f <= 35.760 and 139.720 <= lng_f <= 139.760:
            return "13114"  # 北区
        elif 35.740 <= lat_f <= 35.780 and 139.740 <= lng_f <= 139.780:
            return "13116"  # 荒川区
        elif 35.680 <= lat_f <= 35.720 and 139.800 <= lng_f <= 139.840:
            return "13119"  # 板橋区
        elif 35.720 <= lat_f <= 35.760 and 139.680 <= lng_f <= 139.720:
            return "13120"  # 練馬区
        elif 35.680 <= lat_f <= 35.720 and 139.840 <= lng_f <= 139.880:
            return "13121"  # 足立区
        elif 35.720 <= lat_f <= 35.760 and 139.820 <= lng_f <= 139.880:
            return "13123"  # 葛飾区
        elif 35.660 <= lat_f <= 35.700 and 139.840 <= lng_f <= 139.900:
            return "13124"  # 江戸川区
        else:
            return None

    except (ValueError, TypeError):
        return None


def _normalize_single_address(address: str) -> str:
    """
    単一住所の正規化

    Args:
        address: 住所文字列

    Returns:
        正規化された住所
    """
    # 基本的な正規化処理
    normalized = address.strip()

    # 全角数字を半角に変換
    normalized = normalized.translate(
        str.maketrans("０１２３４５６７８９", "0123456789")
    )

    # 全角ハイフンを半角に変換
    normalized = normalized.replace("－", "-").replace("—", "-")

    # 連続する空白を単一に統合
    normalized = re.sub(r"\s+", " ", normalized)

    # 「東京都」の統一
    normalized = re.sub(r"^(東京都\s*)?", "東京都", normalized)

    # 区名の統一
    ward_names = {
        "千代田": "千代田区",
        "中央": "中央区",
        "港": "港区",
        "新宿": "新宿区",
        "文京": "文京区",
        "台東": "台東区",
        "墨田": "墨田区",
        "江東": "江東区",
        "品川": "品川区",
        "目黒": "目黒区",
        "大田": "大田区",
        "世田谷": "世田谷区",
        "渋谷": "渋谷区",
        "中野": "中野区",
        "杉並": "杉並区",
        "豊島": "豊島区",
        "北": "北区",
        "荒川": "荒川区",
        "板橋": "板橋区",
        "練馬": "練馬区",
        "足立": "足立区",
        "葛飾": "葛飾区",
        "江戸川": "江戸川区",
    }

    for ward_short, ward_full in ward_names.items():
        if ward_short + "区" not in normalized and ward_short in normalized:
            normalized = normalized.replace(ward_short, ward_full)

    return normalized


def get_ward_name_from_code(ward_code: str) -> str:
    """
    区コードから区名を取得

    Args:
        ward_code: 区コード（5桁）

    Returns:
        区名
    """
    ward_code_mapping = {
        "13101": "千代田区",
        "13102": "中央区",
        "13103": "港区",
        "13104": "新宿区",
        "13105": "文京区",
        "13106": "台東区",
        "13107": "墨田区",
        "13108": "江東区",
        "13109": "品川区",
        "13110": "目黒区",
        "13111": "大田区",
        "13112": "世田谷区",
        "13113": "渋谷区",
        "13114": "中野区",
        "13115": "杉並区",
        "13116": "豊島区",
        "13117": "北区",
        "13118": "荒川区",
        "13119": "板橋区",
        "13120": "練馬区",
        "13121": "足立区",
        "13122": "葛飾区",
        "13123": "江戸川区",
    }

    return ward_code_mapping.get(ward_code, f"Unknown({ward_code})")


def calculate_distance_meters(
    lat1: float, lng1: float, lat2: float, lng2: float
) -> float:
    """
    2点間の距離をメートル単位で計算（ハヴァーサイン公式）

    Args:
        lat1, lng1: 地点1の緯度・経度
        lat2, lng2: 地点2の緯度・経度

    Returns:
        距離（メートル）
    """
    import math

    # 地球の半径（メートル）
    R = 6371000

    try:
        # ラジアンに変換
        lat1_rad = math.radians(float(lat1))
        lng1_rad = math.radians(float(lng1))
        lat2_rad = math.radians(float(lat2))
        lng2_rad = math.radians(float(lng2))

        # ハヴァーサイン公式
        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = R * c
        return distance

    except (ValueError, TypeError):
        return float("inf")


def create_geographical_summary(df: pd.DataFrame) -> Dict:
    """
    地理的データの要約統計を作成

    Args:
        df: 地理的データを含むデータフレーム

    Returns:
        地理的要約統計辞書
    """
    summary = {
        "total_records": len(df),
        "valid_coordinates": 0,
        "coordinate_range": {},
        "ward_distribution": {},
        "centroid": {},
    }

    if "latitude" in df.columns and "longitude" in df.columns:
        valid_coords_mask = (
            pd.notna(df["latitude"])
            & pd.notna(df["longitude"])
            & (df["latitude"] >= 35.0)
            & (df["latitude"] <= 36.0)
            & (df["longitude"] >= 139.0)
            & (df["longitude"] <= 140.0)
        )

        valid_df = df[valid_coords_mask]
        summary["valid_coordinates"] = len(valid_df)

        if len(valid_df) > 0:
            summary["coordinate_range"] = {
                "lat_min": float(valid_df["latitude"].min()),
                "lat_max": float(valid_df["latitude"].max()),
                "lng_min": float(valid_df["longitude"].min()),
                "lng_max": float(valid_df["longitude"].max()),
            }

            summary["centroid"] = {
                "lat": float(valid_df["latitude"].mean()),
                "lng": float(valid_df["longitude"].mean()),
            }

    # 区分布統計
    if "ward_code" in df.columns:
        ward_counts = df["ward_code"].value_counts().to_dict()
        summary["ward_distribution"] = {
            get_ward_name_from_code(str(k)): v for k, v in ward_counts.items()
        }

    return summary
