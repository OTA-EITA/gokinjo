"""
汎用区データ処理器
設定ファイルからデータを読み込んでfor文で一括処理
"""

import os
import subprocess
from typing import List, Dict
import logging

# 設定ファイルをインポート
from tokyo_etl.config.district_data import (
    get_districts_by_priority,
    get_district_data,
    generate_area_sql,
    generate_school_sql, 
    generate_crime_sql
)

logger = logging.getLogger(__name__)


class GenericDistrictProcessor:
    """汎用区データ処理クラス"""
    
    def __init__(self):
        # Airflow環境からはhost.docker.internalでアプリのPostgreSQLに接続
        self.pg_host = os.getenv("POSTGRES_HOST", "host.docker.internal")
        self.pg_port = os.getenv("POSTGRES_PORT", "5432")
        self.pg_db = os.getenv("POSTGRES_DB", "neighborhood_mapping")
        self.pg_user = os.getenv("POSTGRES_USER", "postgres")
        self.pg_password = os.getenv("POSTGRES_PASSWORD", "password")
    
    def generate_district_sql(self, ward_code: str) -> str:
        """区データからSQL生成"""
        district_data = get_district_data(ward_code)
        if not district_data:
            raise ValueError(f"区データが見つかりません: {ward_code}")
        
        sql_parts = []
        
        # ヘッダーコメント
        sql_parts.append(f"-- {district_data['name']}データ追加（Priority {district_data['priority']}）")
        sql_parts.append(f"-- 区コード: {ward_code}")
        sql_parts.append("")
        
        # エリアデータINSERT
        sql_parts.append("-- エリア追加")
        sql_parts.append("INSERT INTO areas (ward_code, town_code, name, geom) VALUES")
        area_values = []
        for area in district_data['areas']:
            area_values.append(generate_area_sql(ward_code, area))
        sql_parts.append(',\n'.join(area_values))
        sql_parts.append("ON CONFLICT DO NOTHING;")
        sql_parts.append("")
        
        # 学校データINSERT
        sql_parts.append(f"-- {district_data['name']}学校データ")
        sql_parts.append("INSERT INTO schools (name, type, public_private, location, area_id, address)")
        sql_parts.append("SELECT")
        sql_parts.append("    name, type::school_type, public_private::school_ownership, location,")
        sql_parts.append(f"    (SELECT id FROM areas WHERE ward_code = '{ward_code}' AND town_code = area_town_code LIMIT 1),")
        sql_parts.append("    address")
        sql_parts.append("FROM (VALUES")
        
        school_values = []
        for school in district_data['schools']:
            school_values.append("    " + generate_school_sql(school))
        sql_parts.append(',\n'.join(school_values))
        sql_parts.append(") AS schools_data(name, type, public_private, location, area_town_code, address)")
        sql_parts.append("ON CONFLICT DO NOTHING;")
        sql_parts.append("")
        
        # 犯罪データINSERT
        sql_parts.append(f"-- {district_data['name']}犯罪データ")
        sql_parts.append("INSERT INTO crimes (category, date, location, area_id, description) VALUES")
        
        crime_values = []
        for crime in district_data['crimes']:
            lon, lat = crime['location'].split()
            area_lookup = f"(SELECT id FROM areas WHERE ward_code = '{ward_code}' AND town_code = '{crime['area_town_code']}' LIMIT 1)"
            crime_value = f"('{crime['category']}', '{crime['date']}', ST_GeomFromText('POINT({lon} {lat})', 4326), {area_lookup}, '{crime['description']}')"
            crime_values.append(crime_value)
        
        sql_parts.append(',\n'.join(crime_values))
        sql_parts.append("ON CONFLICT DO NOTHING;")
        sql_parts.append("")
        
        # 統計確認
        sql_parts.append("-- データ投入結果確認")
        sql_parts.append("DO $$")
        sql_parts.append("BEGIN")
        sql_parts.append(f"    RAISE NOTICE '=== {district_data['name']}データ追加結果（Priority {district_data['priority']}） ===';")
        sql_parts.append("END")
        sql_parts.append("$$;")
        sql_parts.append("")
        sql_parts.append("SELECT")
        sql_parts.append(f"    '{district_data['name']}' as ward_name,")
        sql_parts.append(f"    '{ward_code}' as ward_code,")
        sql_parts.append("    COUNT(DISTINCT a.id) as areas_count,")
        sql_parts.append("    COUNT(DISTINCT s.id) as schools_count,")
        sql_parts.append("    COUNT(DISTINCT c.id) as crimes_count")
        sql_parts.append("FROM areas a")
        sql_parts.append("LEFT JOIN schools s ON s.area_id = a.id")
        sql_parts.append("LEFT JOIN crimes c ON c.area_id = a.id")
        sql_parts.append(f"WHERE a.ward_code = '{ward_code}';")
        sql_parts.append("")
        sql_parts.append("COMMIT;")
        
        return '\n'.join(sql_parts)
    
    def process_districts_by_priority(self, priority: int) -> Dict[str, str]:
        """指定優先度の区を一括処理"""
        districts = get_districts_by_priority(priority)
        results = {}
        
        logger.info(f"Priority {priority} の区データ処理開始: {len(districts)}区")
        
        for ward_code, district_data in districts.items():
            logger.info(f"処理中: {district_data['name']} ({ward_code})")
            
            try:
                # SQL生成
                sql_content = self.generate_district_sql(ward_code)
                
                # 一時SQLファイル作成
                temp_sql_file = f"/tmp/{ward_code}_{district_data['name']}.sql"
                with open(temp_sql_file, 'w', encoding='utf-8') as f:
                    f.write(sql_content)
                
                # PostgreSQL実行
                success = self.execute_sql_file(temp_sql_file)
                
                if success:
                    results[ward_code] = "success"
                    logger.info(f"{district_data['name']} 処理完了")
                else:
                    results[ward_code] = "failed"
                    logger.error(f"{district_data['name']} 処理失敗")
                
                # 一時ファイル削除
                os.unlink(temp_sql_file)
                
            except Exception as e:
                results[ward_code] = f"error: {str(e)}"
                logger.error(f"{district_data['name']} 処理でエラー: {str(e)}")
        
        return results
    
    def execute_sql_file(self, sql_file_path: str) -> bool:
        """SQLファイルを実行"""
        try:
            cmd = [
                "psql",
                f"-h{self.pg_host}",
                f"-p{self.pg_port}",
                f"-U{self.pg_user}",
                f"-d{self.pg_db}",
                f"-f{sql_file_path}",
                "--echo-queries",
                "--set=ON_ERROR_STOP=1"
            ]
            
            env = os.environ.copy()
            env["PGPASSWORD"] = self.pg_password
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=300  # 5分タイムアウト
            )
            
            if result.returncode == 0:
                logger.debug(f"SQL実行結果:\n{result.stdout}")
                return True
            else:
                logger.error(f"SQL実行エラー:\n{result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("SQL実行がタイムアウトしました（5分）")
            return False
        except Exception as e:
            logger.error(f"SQL実行で予期しないエラー: {str(e)}")
            return False
    
    def verify_district_data(self, ward_code: str) -> Dict[str, int]:
        """区データの検証"""
        verification_sql = f"""
            SELECT 
                COUNT(DISTINCT a.id) as areas_count,
                COUNT(DISTINCT s.id) as schools_count,
                COUNT(DISTINCT c.id) as crimes_count
            FROM areas a
            LEFT JOIN schools s ON s.area_id = a.id
            LEFT JOIN crimes c ON c.area_id = a.id
            WHERE a.ward_code = '{ward_code}';
        """
        
        try:
            cmd = [
                "psql",
                f"-h{self.pg_host}",
                f"-p{self.pg_port}",
                f"-U{self.pg_user}",
                f"-d{self.pg_db}",
                "-c", verification_sql,
                "--tuples-only",
                "--no-align"
            ]
            
            env = os.environ.copy()
            env["PGPASSWORD"] = self.pg_password
            
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                output = result.stdout.strip()
                parts = output.split("|")
                if len(parts) >= 3:
                    return {
                        "areas_count": int(parts[0].strip()),
                        "schools_count": int(parts[1].strip()),
                        "crimes_count": int(parts[2].strip())
                    }
            
            return {"areas_count": 0, "schools_count": 0, "crimes_count": 0}
            
        except Exception as e:
            logger.error(f"データ検証エラー: {str(e)}")
            return {"areas_count": 0, "schools_count": 0, "crimes_count": 0}


# Airflow タスク関数（汎用版）
def process_districts_by_priority(priority: int, **context):
    """指定Priorityの区データ一括処理タスク"""
    processor = GenericDistrictProcessor()
    results = processor.process_districts_by_priority(priority)
    
    success_count = sum(1 for r in results.values() if r == "success")
    total_count = len(results)
    
    print(f"Priority {priority}区処理結果: {success_count}/{total_count}区 成功")
    
    for ward_code, result in results.items():
        district_data = get_district_data(ward_code)
        if result == "success":
            print(f"{district_data['name']} ({ward_code}): 完了")
        else:
            print(f"{district_data['name']} ({ward_code}): {result}")
    
    if success_count < total_count:
        raise RuntimeError(f"一部の区でエラーが発生しました: {total_count - success_count}区")
    
    return f"priority_{priority}_processing_success: {success_count}区"


def verify_districts_by_priority(priority: int, **context):
    """指定Priorityの区データ検証タスク"""
    processor = GenericDistrictProcessor()
    districts = get_districts_by_priority(priority)
    
    total_stats = {"areas": 0, "schools": 0, "crimes": 0}
    
    for ward_code, district_data in districts.items():
        stats = processor.verify_district_data(ward_code)
        total_stats["areas"] += stats["areas_count"]
        total_stats["schools"] += stats["schools_count"] 
        total_stats["crimes"] += stats["crimes_count"]
        
        print(f"{district_data['name']}: エリア{stats['areas_count']}, 学校{stats['schools_count']}, 犯罪{stats['crimes_count']}")
    
    print(f"Priority {priority}区合計: エリア{total_stats['areas']}, 学校{total_stats['schools']}, 犯罪{total_stats['crimes']}")
    
    return f"verification_success: {total_stats}"


# 後方互換性のための関数（既存DAGで使用されている場合）
def process_priority_3_districts(**context):
    """Priority 3区データ一括処理タスク（後方互換）"""
    return process_districts_by_priority(3, **context)


def verify_priority_3_districts(**context):
    """Priority 3区データ検証タスク（後方互換）"""
    return verify_districts_by_priority(3, **context)
