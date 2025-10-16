"""
東京23区の詳細データ設定
各区のエリア・学校・犯罪データを構造化して定義
"""

# 各区の詳細データ設定
DISTRICT_DATA = {
    # 品川区データ（Priority 3）
    "13109": {  # 品川区
        "name": "品川区",
        "priority": 3,
        "areas": [
            {
                "town_code": "001",
                "name": "大井町",
                "polygon": "139.730 35.605, 139.740 35.605, 139.740 35.615, 139.730 35.615, 139.730 35.605",
                "characteristics": "交通の要所・商業地区"
            },
            {
                "town_code": "002",
                "name": "五反田",
                "polygon": "139.723 35.626, 139.733 35.626, 139.733 35.636, 139.723 35.636, 139.723 35.626",
                "characteristics": "オフィス街・繁華街"
            },
            {
                "town_code": "003",
                "name": "天王洲",
                "polygon": "139.745 35.620, 139.755 35.620, 139.755 35.630, 139.745 35.630, 139.745 35.620",
                "characteristics": "湾岸エリア・オフィス街"
            },
            {
                "town_code": "004",
                "name": "戸越",
                "polygon": "139.713 35.615, 139.723 35.615, 139.723 35.625, 139.713 35.625, 139.713 35.615",
                "characteristics": "住宅街・商店街"
            }
        ],
        "schools": [
            {
                "name": "品川区立大井第一小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.734 35.609",
                "area_town_code": "001",
                "address": "東京都品川区大井１丁目"
            },
            {
                "name": "品川区立浜川中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.736 35.611",
                "area_town_code": "001",
                "address": "東京都品川区大井２丁目"
            },
            {
                "name": "品川商業高等学校",
                "type": "high",
                "public_private": "public",
                "location": "139.732 35.607",
                "area_town_code": "001",
                "address": "東京都品川区大井３丁目"
            },
            {
                "name": "品川区立五反田小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.727 35.630",
                "area_town_code": "002",
                "address": "東京都品川区五反田１丁目"
            },
            {
                "name": "品川区立戸越台中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.729 35.632",
                "area_town_code": "002",
                "address": "東京都品川区五反田２丁目"
            },
            {
                "name": "品川女子学院高等部",
                "type": "high",
                "public_private": "private",
                "location": "139.725 35.628",
                "area_town_code": "002",
                "address": "東京都品川区五反田３丁目"
            },
            {
                "name": "品川区立八潮小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.749 35.624",
                "area_town_code": "003",
                "address": "東京都品川区八潮１丁目"
            },
            {
                "name": "品川区立伊藤中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.751 35.626",
                "area_town_code": "003",
                "address": "東京都品川区八潮２丁目"
            },
            {
                "name": "品川エトワール女子高等学校",
                "type": "high",
                "public_private": "private",
                "location": "139.747 35.622",
                "area_town_code": "003",
                "address": "東京都品川区南品川３丁目"
            },
            {
                "name": "品川区立戸越小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.717 35.619",
                "area_town_code": "004",
                "address": "東京都品川区戸越１丁目"
            },
            {
                "name": "品川区立荒川南中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.719 35.621",
                "area_town_code": "004",
                "address": "東京都品川区戸越２丁目"
            },
            {
                "name": "戸越高等学校",
                "type": "high",
                "public_private": "public",
                "location": "139.715 35.617",
                "area_town_code": "004",
                "address": "東京都品川区戸越３丁目"
            }
        ],
        "crimes": [
            {
                "category": "窃盗",
                "date": "2024-08-01",
                "location": "139.733 35.608",
                "area_town_code": "001",
                "description": "駅構内での置き引き"
            },
            {
                "category": "詐欺",
                "date": "2024-08-05",
                "location": "139.735 35.610",
                "area_town_code": "001",
                "description": "駅前でのキャッチセールス"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-10",
                "location": "139.731 35.606",
                "area_town_code": "001",
                "description": "駐輪場での自転車破損"
            },
            {
                "category": "窃盗",
                "date": "2024-08-15",
                "location": "139.737 35.612",
                "area_town_code": "001",
                "description": "商店街での万引き"
            },
            {
                "category": "暴行",
                "date": "2024-08-20",
                "location": "139.734 35.609",
                "area_town_code": "001",
                "description": "繁華街でのトラブル"
            },
            {
                "category": "窃盗",
                "date": "2024-08-02",
                "location": "139.726 35.629",
                "area_town_code": "002",
                "description": "オフィスビルでの窃盗"
            },
            {
                "category": "詐欺",
                "date": "2024-08-07",
                "location": "139.728 35.631",
                "area_town_code": "002",
                "description": "投資詐欺"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-12",
                "location": "139.724 35.627",
                "area_town_code": "002",
                "description": "路上駐車車両への損壊"
            },
            {
                "category": "窃盗",
                "date": "2024-08-17",
                "location": "139.730 35.633",
                "area_town_code": "002",
                "description": "飲食店での置き引き"
            },
            {
                "category": "詐欺",
                "date": "2024-08-22",
                "location": "139.727 35.630",
                "area_town_code": "002",
                "description": "マンション販売詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-03",
                "location": "139.748 35.623",
                "area_town_code": "003",
                "description": "オフィス街での自転車盗難"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-08",
                "location": "139.750 35.625",
                "area_town_code": "003",
                "description": "公園設備への落書き"
            },
            {
                "category": "詐欺",
                "date": "2024-08-13",
                "location": "139.746 35.621",
                "area_town_code": "003",
                "description": "ビジネス詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-18",
                "location": "139.752 35.627",
                "area_town_code": "003",
                "description": "企業からの窃盗"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-23",
                "location": "139.749 35.624",
                "area_town_code": "003",
                "description": "駐輪場での器物損壊"
            },
            {
                "category": "窃盗",
                "date": "2024-08-04",
                "location": "139.716 35.618",
                "area_town_code": "004",
                "description": "住宅街での空き巣狙い"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-09",
                "location": "139.718 35.620",
                "area_town_code": "004",
                "description": "商店街の看板損壊"
            },
            {
                "category": "詐欺",
                "date": "2024-08-14",
                "location": "139.714 35.616",
                "area_town_code": "004",
                "description": "高齢者狙いの詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-19",
                "location": "139.720 35.622",
                "area_town_code": "004",
                "description": "自転車盗難"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-24",
                "location": "139.717 35.619",
                "area_town_code": "004",
                "description": "公園道具への損壊"
            }
        ]
    },

    # 目黒区データ（Priority 3）
    "13110": {  # 目黒区
        "name": "目黒区",
        "priority": 3,
        "areas": [
            {
                "town_code": "001",
                "name": "自由が丘",
                "polygon": "139.667 35.608, 139.677 35.608, 139.677 35.618, 139.667 35.618, 139.667 35.608",
                "characteristics": "高級住宅地・ファッションタウン"
            },
            {
                "town_code": "002",
                "name": "中目黒",
                "polygon": "139.698 35.645, 139.708 35.645, 139.708 35.655, 139.698 35.655, 139.698 35.645",
                "characteristics": "トレンディな街・飲食店街"
            },
            {
                "town_code": "003",
                "name": "学芸大学",
                "polygon": "139.686 35.628, 139.696 35.628, 139.696 35.638, 139.686 35.638, 139.686 35.628",
                "characteristics": "文教地区・住宅街"
            },
            {
                "town_code": "004",
                "name": "祐天寺",
                "polygon": "139.705 35.635, 139.715 35.635, 139.715 35.645, 139.705 35.645, 139.705 35.635",
                "characteristics": "寺町・住宅地"
            }
        ],
        "schools": [
            {
                "name": "目黒区立緑ヶ丘小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.671 35.612",
                "area_town_code": "001",
                "address": "東京都目黒区自由が丘１丁目"
            },
            {
                "name": "目黒区立第七中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.673 35.614",
                "area_town_code": "001",
                "address": "東京都目黒区自由が丘２丁目"
            },
            {
                "name": "自由ヶ丘学園高等学校",
                "type": "high",
                "public_private": "private",
                "location": "139.669 35.610",
                "area_town_code": "001",
                "address": "東京都目黒区自由が丘３丁目"
            },
            {
                "name": "目黒区立中目黒小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.702 35.649",
                "area_town_code": "002",
                "address": "東京都目黒区上目黒１丁目"
            },
            {
                "name": "目黒区立目黒中央中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.704 35.651",
                "area_town_code": "002",
                "address": "東京都目黒区上目黒２丁目"
            },
            {
                "name": "目黒学院中目黒高等学校",
                "type": "high",
                "public_private": "private",
                "location": "139.700 35.647",
                "area_town_code": "002",
                "address": "東京都目黒区中目黒３丁目"
            },
            {
                "name": "目黒区立五本木小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.690 35.632",
                "area_town_code": "003",
                "address": "東京都目黒区五本木１丁目"
            },
            {
                "name": "目黒区立第九中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.692 35.634",
                "area_town_code": "003",
                "address": "東京都目黒区五本木２丁目"
            },
            {
                "name": "学芸大学附属高等学校",
                "type": "high",
                "public_private": "private",
                "location": "139.688 35.630",
                "area_town_code": "003",
                "address": "東京都目黒区碧山３丁目"
            },
            {
                "name": "目黒区立油面小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.709 35.639",
                "area_town_code": "004",
                "address": "東京都目黒区中町１丁目"
            },
            {
                "name": "目黒区立第一中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.711 35.641",
                "area_town_code": "004",
                "address": "東京都目黒区中町２丁目"
            },
            {
                "name": "目黒高等学校",
                "type": "high",
                "public_private": "public",
                "location": "139.707 35.637",
                "area_town_code": "004",
                "address": "東京都目黒区祐天寺３丁目"
            }
        ],
        "crimes": [
            {
                "category": "窃盗",
                "date": "2024-08-01",
                "location": "139.670 35.611",
                "area_town_code": "001",
                "description": "高級ブティックでの万引き"
            },
            {
                "category": "詐欺",
                "date": "2024-08-05",
                "location": "139.672 35.613",
                "area_town_code": "001",
                "description": "高級ブランド詐欺"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-10",
                "location": "139.668 35.609",
                "area_town_code": "001",
                "description": "駐車場での車両損壊"
            },
            {
                "category": "窃盗",
                "date": "2024-08-15",
                "location": "139.674 35.615",
                "area_town_code": "001",
                "description": "住宅侵入窃盗"
            },
            {
                "category": "詐欺",
                "date": "2024-08-20",
                "location": "139.671 35.612",
                "area_town_code": "001",
                "description": "投資詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-02",
                "location": "139.701 35.648",
                "area_town_code": "002",
                "description": "飲食店での置き引き"
            },
            {
                "category": "詐欺",
                "date": "2024-08-07",
                "location": "139.703 35.650",
                "area_town_code": "002",
                "description": "キャッチセールス詐欺"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-12",
                "location": "139.699 35.646",
                "area_town_code": "002",
                "description": "駐輪場での自転車破損"
            },
            {
                "category": "窃盗",
                "date": "2024-08-17",
                "location": "139.705 35.652",
                "area_town_code": "002",
                "description": "商店街でのスリ"
            },
            {
                "category": "暴行",
                "date": "2024-08-22",
                "location": "139.702 35.649",
                "area_town_code": "002",
                "description": "繁華街でのトラブル"
            },
            {
                "category": "窃盗",
                "date": "2024-08-03",
                "location": "139.689 35.631",
                "area_town_code": "003",
                "description": "住宅街での自転車盗難"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-08",
                "location": "139.691 35.633",
                "area_town_code": "003",
                "description": "公園設備への落書き"
            },
            {
                "category": "詐欺",
                "date": "2024-08-13",
                "location": "139.687 35.629",
                "area_town_code": "003",
                "description": "高齢者狙いの詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-18",
                "location": "139.693 35.635",
                "area_town_code": "003",
                "description": "住宅での空き巣狙い"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-23",
                "location": "139.690 35.632",
                "area_town_code": "003",
                "description": "商店看板への損壊"
            },
            {
                "category": "窃盗",
                "date": "2024-08-04",
                "location": "139.708 35.638",
                "area_town_code": "004",
                "description": "寺社での賽銭窃盗"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-09",
                "location": "139.710 35.640",
                "area_town_code": "004",
                "description": "自動販売機への損壊"
            },
            {
                "category": "詐欺",
                "date": "2024-08-14",
                "location": "139.706 35.636",
                "area_town_code": "004",
                "description": "訪問販売詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-19",
                "location": "139.712 35.642",
                "area_town_code": "004",
                "description": "住宅侵入窃盗"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-24",
                "location": "139.709 35.639",
                "area_town_code": "004",
                "description": "公園道具への損壊"
            }
        ]
    },

    # 墨田区データ（Priority 3）
    "13107": {  # 墨田区
        "name": "墨田区",
        "priority": 3,
        "areas": [
            {
                "town_code": "001",
                "name": "両国",
                "polygon": "139.787 35.694, 139.797 35.694, 139.797 35.704, 139.787 35.704, 139.787 35.694",
                "characteristics": "相撲の町・歴史ある下町"
            },
            {
                "town_code": "002",
                "name": "錦糸町",
                "polygon": "139.810 35.695, 139.820 35.695, 139.820 35.705, 139.810 35.705, 139.810 35.695",
                "characteristics": "商業・ビジネス地区"
            },
            {
                "town_code": "003",
                "name": "押上",
                "polygon": "139.808 35.708, 139.818 35.708, 139.818 35.718, 139.808 35.718, 139.808 35.708",
                "characteristics": "スカイツリー周辺・新開発地域"
            },
            {
                "town_code": "004",
                "name": "向島",
                "polygon": "139.801 35.715, 139.811 35.715, 139.811 35.725, 139.801 35.725, 139.801 35.715",
                "characteristics": "伝統的下町住宅地"
            }
        ],
        "schools": [
            {
                "name": "墨田区立両国小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.791 35.698",
                "area_town_code": "001",
                "address": "東京都墨田区両国4-26-6"
            },
            {
                "name": "安田学園中学校",
                "type": "junior_high",
                "public_private": "private",
                "location": "139.793 35.700",
                "area_town_code": "001",
                "address": "東京都墨田区横網2-2-25"
            },
            {
                "name": "両国高等学校",
                "type": "high",
                "public_private": "public",
                "location": "139.789 35.696",
                "area_town_code": "001",
                "address": "東京都墨田区江東橋1-7-14"
            },
            {
                "name": "墨田区立錦糸小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.814 35.699",
                "area_town_code": "002",
                "address": "東京都墨田区錦糸4-4-1"
            },
            {
                "name": "墨田区立錦糸中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.816 35.701",
                "area_town_code": "002",
                "address": "東京都墨田区錦糸3-1-15"
            },
            {
                "name": "中央学院大学中央高等学校",
                "type": "high",
                "public_private": "private",
                "location": "139.812 35.697",
                "area_town_code": "002",
                "address": "東京都墨田区江東橋3-1-6"
            },
            {
                "name": "墨田区立業平小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.812 35.712",
                "area_town_code": "003",
                "address": "東京都墨田区業平5-7-7"
            },
            {
                "name": "墨田区立押上小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.814 35.714",
                "area_town_code": "003",
                "address": "東京都墨田区押上2-26-12"
            },
            {
                "name": "日本大学第一中学校",
                "type": "junior_high",
                "public_private": "private",
                "location": "139.810 35.710",
                "area_town_code": "003",
                "address": "東京都墨田区横網1-5-2"
            },
            {
                "name": "墨田区立向島小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.805 35.719",
                "area_town_code": "004",
                "address": "東京都墨田区向島1-22-17"
            },
            {
                "name": "墨田区立寺島中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.807 35.721",
                "area_town_code": "004",
                "address": "東京都墨田区東向島6-8-1"
            },
            {
                "name": "向島学院高等学校",
                "type": "high",
                "public_private": "private",
                "location": "139.803 35.717",
                "area_town_code": "004",
                "address": "東京都墨田区向島3-34-6"
            }
        ],
        "crimes": [
            {
                "category": "窃盗",
                "date": "2024-08-01",
                "location": "139.790 35.697",
                "area_town_code": "001",
                "description": "国技館周辺での観光客狙いのスリ"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-05",
                "location": "139.794 35.701",
                "area_town_code": "001",
                "description": "江戸東京博物館前の自転車破損"
            },
            {
                "category": "詐欺",
                "date": "2024-08-08",
                "location": "139.792 35.699",
                "area_town_code": "001",
                "description": "相撲関連グッズの偽物販売"
            },
            {
                "category": "窃盗",
                "date": "2024-08-12",
                "location": "139.788 35.695",
                "area_town_code": "001",
                "description": "ちゃんこ料理店での置き引き"
            },
            {
                "category": "暴行",
                "date": "2024-08-15",
                "location": "139.795 35.702",
                "area_town_code": "001",
                "description": "酒場での客同士のトラブル"
            },
            {
                "category": "窃盗",
                "date": "2024-08-02",
                "location": "139.813 35.698",
                "area_town_code": "002",
                "description": "JR錦糸町駅構内での置き引き"
            },
            {
                "category": "詐欺",
                "date": "2024-08-06",
                "location": "139.817 35.702",
                "area_town_code": "002",
                "description": "繁華街でのぼったくり"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-09",
                "location": "139.815 35.700",
                "area_town_code": "002",
                "description": "パチンコ店駐車場での車両損傷"
            },
            {
                "category": "窃盗",
                "date": "2024-08-14",
                "location": "139.811 35.696",
                "area_town_code": "002",
                "description": "デパート内での万引き"
            },
            {
                "category": "暴行",
                "date": "2024-08-18",
                "location": "139.819 35.703",
                "area_town_code": "002",
                "description": "深夜の飲み屋街でのトラブル"
            },
            {
                "category": "詐欺",
                "date": "2024-08-20",
                "location": "139.812 35.697",
                "area_town_code": "002",
                "description": "キャッチセールス詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-03",
                "location": "139.811 35.711",
                "area_town_code": "003",
                "description": "東京スカイツリー周辺での観光客スリ"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-07",
                "location": "139.815 35.715",
                "area_town_code": "003",
                "description": "ソラマチでの器物破損"
            },
            {
                "category": "詐欺",
                "date": "2024-08-11",
                "location": "139.813 35.713",
                "area_town_code": "003",
                "description": "観光地でのニセモノ土産品販売"
            },
            {
                "category": "窃盗",
                "date": "2024-08-16",
                "location": "139.809 35.709",
                "area_town_code": "003",
                "description": "新築マンション駐輪場での自転車盗難"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-19",
                "location": "139.817 35.716",
                "area_town_code": "003",
                "description": "公園の遊具への落書き"
            },
            {
                "category": "窃盗",
                "date": "2024-08-04",
                "location": "139.804 35.718",
                "area_town_code": "004",
                "description": "住宅街での自転車盗難"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-10",
                "location": "139.808 35.722",
                "area_town_code": "004",
                "description": "商店街の看板損傷"
            },
            {
                "category": "詐欺",
                "date": "2024-08-13",
                "location": "139.806 35.720",
                "area_town_code": "004",
                "description": "高齢者狙いの訪問販売詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-17",
                "location": "139.802 35.716",
                "area_town_code": "004",
                "description": "銭湯での貴重品盗難"
            }
        ]
    },

    # 江東区データ（Priority 3）
    "13108": {  # 江東区
        "name": "江東区",
        "priority": 3,
        "areas": [
            {
                "town_code": "001",
                "name": "豊洲",
                "polygon": "139.790 35.650, 139.800 35.650, 139.800 35.660, 139.790 35.660, 139.790 35.650",
                "characteristics": "湾岸新都心・タワーマンション"
            },
            {
                "town_code": "002",
                "name": "お台場",
                "polygon": "139.770 35.620, 139.780 35.620, 139.780 35.630, 139.770 35.630, 139.770 35.620",
                "characteristics": "観光・商業・エンターテイメント地区"
            },
            {
                "town_code": "003",
                "name": "亀戸",
                "polygon": "139.825 35.697, 139.835 35.697, 139.835 35.707, 139.825 35.707, 139.825 35.697",
                "characteristics": "下町商店街・住宅地"
            },
            {
                "town_code": "004",
                "name": "門前仲町",
                "polygon": "139.795 35.672, 139.805 35.672, 139.805 35.682, 139.795 35.682, 139.795 35.672",
                "characteristics": "伝統的下町・寺社仲町"
            }
        ],
        "schools": [
            {
                "name": "江東区立豊洲北小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.794 35.654",
                "area_town_code": "001",
                "address": "東京都江東区豊洲2-2-1"
            },
            {
                "name": "江東区立深川第二中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.796 35.656",
                "area_town_code": "001",
                "address": "東京都江東区豊洲3-7-3"
            },
            {
                "name": "芝浦工業高等学校",
                "type": "high",
                "public_private": "public",
                "location": "139.792 35.652",
                "area_town_code": "001",
                "address": "東京都江東区豊洲1-1-1"
            },
            {
                "name": "江東区立有明小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.774 35.624",
                "area_town_code": "002",
                "address": "東京都江東区有明2-7-1"
            },
            {
                "name": "江東区立有明中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.776 35.626",
                "area_town_code": "002",
                "address": "東京都江東区有明1-5-15"
            },
            {
                "name": "有明高等学校",
                "type": "high",
                "public_private": "private",
                "location": "139.772 35.622",
                "area_town_code": "002",
                "address": "東京都江東区有明2-1-8"
            },
            {
                "name": "江東区立第二亀戸小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.829 35.701",
                "area_town_code": "003",
                "address": "東京都江東区亀戸6-42-19"
            },
            {
                "name": "江東区立亀戸中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.831 35.703",
                "area_town_code": "003",
                "address": "東京都江東区亀戸5-42-2"
            },
            {
                "name": "江東商業高等学校",
                "type": "high",
                "public_private": "public",
                "location": "139.827 35.699",
                "area_town_code": "003",
                "address": "東京都江東区亀戸8-1-1"
            },
            {
                "name": "江東区立深川小学校",
                "type": "elementary",
                "public_private": "public",
                "location": "139.799 35.676",
                "area_town_code": "004",
                "address": "東京都江東区深川1-6-6"
            },
            {
                "name": "江東区立深川第一中学校",
                "type": "junior_high",
                "public_private": "public",
                "location": "139.801 35.678",
                "area_town_code": "004",
                "address": "東京都江東区深川2-12-12"
            },
            {
                "name": "深川高等学校",
                "type": "high",
                "public_private": "public",
                "location": "139.797 35.674",
                "area_town_code": "004",
                "address": "東京都江東区深川5-8-5"
            }
        ],
        "crimes": [
            {
                "category": "窃盗",
                "date": "2024-08-01",
                "location": "139.793 35.653",
                "area_town_code": "001",
                "description": "タワーマンション駐車場での車上荒らし"
            },
            {
                "category": "詐欺",
                "date": "2024-08-05",
                "location": "139.795 35.655",
                "area_town_code": "001",
                "description": "高級マンション狙いのリフォーム詐欺"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-10",
                "location": "139.791 35.651",
                "area_town_code": "001",
                "description": "商業施設のガラス破損"
            },
            {
                "category": "窃盗",
                "date": "2024-08-15",
                "location": "139.797 35.657",
                "area_town_code": "001",
                "description": "ショッピングモールでの置き引き"
            },
            {
                "category": "詐欺",
                "date": "2024-08-20",
                "location": "139.794 35.654",
                "area_town_code": "001",
                "description": "不動産投資詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-02",
                "location": "139.773 35.623",
                "area_town_code": "002",
                "description": "観光地でのスリ"
            },
            {
                "category": "詐欺",
                "date": "2024-08-07",
                "location": "139.775 35.625",
                "area_town_code": "002",
                "description": "観光客狙いのニセモノ販売"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-12",
                "location": "139.771 35.621",
                "area_town_code": "002",
                "description": "駐車場での車両損壊"
            },
            {
                "category": "窃盗",
                "date": "2024-08-17",
                "location": "139.777 35.627",
                "area_town_code": "002",
                "description": "イベント会場での財布窃盗"
            },
            {
                "category": "詐欺",
                "date": "2024-08-22",
                "location": "139.774 35.624",
                "area_town_code": "002",
                "description": "チケット詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-03",
                "location": "139.828 35.700",
                "area_town_code": "003",
                "description": "商店街での自転車盗難"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-08",
                "location": "139.830 35.702",
                "area_town_code": "003",
                "description": "商店看板の損壊"
            },
            {
                "category": "詐欺",
                "date": "2024-08-13",
                "location": "139.826 35.698",
                "area_town_code": "003",
                "description": "高齢者狙いの訪問販売詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-18",
                "location": "139.832 35.704",
                "area_town_code": "003",
                "description": "住宅侵入窃盗"
            },
            {
                "category": "暴行",
                "date": "2024-08-23",
                "location": "139.829 35.701",
                "area_town_code": "003",
                "description": "居酒屋でのトラブル"
            },
            {
                "category": "窃盗",
                "date": "2024-08-04",
                "location": "139.798 35.675",
                "area_town_code": "004",
                "description": "寺社での賽銭窃盗"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-09",
                "location": "139.800 35.677",
                "area_town_code": "004",
                "description": "伝統商店街の看板損壊"
            },
            {
                "category": "詐欺",
                "date": "2024-08-14",
                "location": "139.796 35.673",
                "area_town_code": "004",
                "description": "骨董品詐欺"
            },
            {
                "category": "窃盗",
                "date": "2024-08-19",
                "location": "139.802 35.679",
                "area_town_code": "004",
                "description": "住宅での空き巣狙い"
            },
            {
                "category": "器物損壊",
                "date": "2024-08-24",
                "location": "139.799 35.676",
                "area_town_code": "004",
                "description": "公園設備への落書き"
            }
        ]
    }
}


def get_district_data(ward_code: str) -> dict:
    """区コードから詳細データを取得"""
    return DISTRICT_DATA.get(ward_code, None)


def get_districts_by_priority(priority: int) -> dict:
    """指定されたPriorityの区の詳細データを取得"""
    return {
        ward_code: data
        for ward_code, data in DISTRICT_DATA.items()
        if data["priority"] == priority
    }


def get_priority_3_districts() -> dict:
    """Priority 3区の詳細データを取得"""
    return get_districts_by_priority(3)


def generate_area_sql(ward_code: str, area_data: dict) -> str:
    """エリアデータのSQL生成"""
    return f"('{ward_code}', '{area_data['town_code']}', '{area_data['name']}', ST_GeomFromText('POLYGON(({area_data['polygon']}))', 4326))"


def generate_school_sql(school_data: dict) -> str:
    """学校データのSQL生成"""
    lon, lat = school_data['location'].split()
    return f"('{school_data['name']}', '{school_data['type']}', '{school_data['public_private']}', ST_GeomFromText('POINT({lon} {lat})', 4326), '{school_data['area_town_code']}', '{school_data['address']}')"


def generate_crime_sql(crime_data: dict) -> str:
    """犯罪データのSQL生成"""
    lon, lat = crime_data['location'].split()
    return f"('{crime_data['category']}', '{crime_data['date']}', ST_GeomFromText('POINT({lon} {lat})', 4326), '{crime_data['area_town_code']}', '{crime_data['description']}')"
