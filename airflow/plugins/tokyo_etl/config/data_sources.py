"""Data Source URLs and API Configurations"""

# 公式オープンデータAPI
DATA_SOURCES = {
    "crime": {
        "api_url": "https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/opendata.html",
        "format": "csv",
        "update_frequency": "monthly",
        "description": "警視庁 区市町村の町丁別犯罪統計",
    },
    "school": {
        "api_url": "https://api.data.metro.tokyo.lg.jp/v1/School",
        "format": "json",
        "update_frequency": "yearly",
        "description": "東京都教育委員会 学校基本情報",
    },
    "boundary": {
        "api_url": "https://portal.data.metro.tokyo.lg.jp/",
        "format": "geojson",
        "update_frequency": "irregular",
        "description": "東京都都市整備局 町丁目境界データ",
    },
}

# API認証設定（環境変数から取得）
API_CONFIG = {"timeout": 30, "retry_count": 3, "retry_delay": 5}
