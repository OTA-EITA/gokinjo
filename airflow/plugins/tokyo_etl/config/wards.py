"""Tokyo Wards Configuration"""

# 東京23区定義
TOKYO_WARDS = [
    {"code": "13101", "name": "千代田区", "priority": 1},
    {"code": "13102", "name": "中央区", "priority": 1},
    {"code": "13103", "name": "港区", "priority": 1},
    {"code": "13104", "name": "新宿区", "priority": 1},
    {"code": "13105", "name": "文京区", "priority": 2},
    {"code": "13106", "name": "台東区", "priority": 2},
    {"code": "13107", "name": "墨田区", "priority": 3},
    {"code": "13108", "name": "江東区", "priority": 3},
    {"code": "13109", "name": "品川区", "priority": 3},
    {"code": "13110", "name": "目黒区", "priority": 3},
    {"code": "13111", "name": "大田区", "priority": 4},
    {"code": "13112", "name": "世田谷区", "priority": 1},
    {"code": "13113", "name": "渋谷区", "priority": 1},
    {"code": "13114", "name": "中野区", "priority": 4},
    {"code": "13115", "name": "杉並区", "priority": 4},
    {"code": "13116", "name": "豊島区", "priority": 4},
    {"code": "13117", "name": "北区", "priority": 5},
    {"code": "13118", "name": "荒川区", "priority": 5},
    {"code": "13119", "name": "板橋区", "priority": 5},
    {"code": "13120", "name": "練馬区", "priority": 5},
    {"code": "13121", "name": "足立区", "priority": 6},
    {"code": "13122", "name": "葛飾区", "priority": 6},
    {"code": "13123", "name": "江戸川区", "priority": 6},
]


def get_wards_by_priority(priority: int) -> list:
    """指定されたPriorityの区を取得"""
    return [ward for ward in TOKYO_WARDS if ward["priority"] == priority]


def get_ward_by_code(ward_code: str) -> dict:
    """区コードから区情報を取得"""
    for ward in TOKYO_WARDS:
        if ward["code"] == ward_code:
            return ward
    return None


def get_priority_2_wards() -> list:
    """Priority 2の区（台東区・文京区）を取得"""
    return get_wards_by_priority(2)
