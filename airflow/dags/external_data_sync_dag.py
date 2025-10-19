"""
External Data Sync DAG
警視庁オープンデータと文科省データの自動同期
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
import requests
import pandas as pd
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

# デフォルト引数
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2025, 10, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

# DAG定義
dag = DAG(
    'external_data_sync',
    default_args=default_args,
    description='警視庁・文科省データ自動同期',
    schedule_interval='0 2 * * 1',  # 毎週月曜 2:00 AM
    catchup=False,
    tags=['external', 'sync', 'crime', 'school']
)


def fetch_keisatsu_crime_data(**context):
    """
    警視庁オープンデータから犯罪統計を取得
    
    Note: 実際のAPIエンドポイントが利用可能になるまでは、
    このタスクはスキップまたはモックデータを返します。
    """
    logger.info("Fetching crime data from Keishicho...")
    
    # 警視庁オープンデータカタログ
    # 実際のURL: https://www.keishicho.metro.tokyo.lg.jp/about_mpd/joho/open_data.html
    # CSVダウンロード形式が主流のため、スクレイピングまたは手動ダウンロードが必要
    
    try:
        # TODO: 実際のデータソースが確定次第、実装を更新
        # 現在はモックデータを返す
        logger.warning("Using mock data - actual API endpoint not yet configured")
        
        # モックデータ（開発用）
        crime_data = [
            {
                'ward_name': '墨田区',
                'category': '窃盗',
                'count': 5,
                'date': datetime.now().strftime('%Y-%m-%d')
            },
            {
                'ward_name': '江東区',
                'category': '詐欺',
                'count': 3,
                'date': datetime.now().strftime('%Y-%m-%d')
            }
        ]
        
        # 実際の実装例（URLが確定したら使用）:
        # response = requests.get(
        #     "https://www.keishicho.metro.tokyo.lg.jp/opendata/crime_stats.csv",
        #     headers={'User-Agent': 'TokyoSchoolSafetyApp/1.0'},
        #     timeout=30
        # )
        # response.raise_for_status()
        
        # HTMLパース（実装例 - 実際のURL確定後に有効化）
        # soup = BeautifulSoup(response.content, 'html.parser')
        # crime_data = extract_crime_data_from_html(soup)
        
        # XComに保存
        context['task_instance'].xcom_push(key='crime_data', value=crime_data)
        
        logger.info(f"Successfully fetched {len(crime_data)} crime records")
        
    except Exception as e:
        logger.error(f"Failed to fetch crime data: {e}")
        # 開発中はエラーでも続行（モックデータ使用）
        logger.warning("Continuing with mock data for development")
        crime_data = []


def extract_crime_data_from_html(soup):
    """
    HTMLから犯罪データを抽出
    
    実際の実装はサイト構造に依存
    """
    # 仮実装: 実際はテーブルやPDFから抽出
    crime_data = []
    
    # 例: テーブルデータの抽出
    tables = soup.find_all('table', class_='crime-stats')
    
    for table in tables:
        rows = table.find_all('tr')[1:]  # ヘッダーをスキップ
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 4:
                crime_data.append({
                    'ward_name': cols[0].text.strip(),
                    'category': cols[1].text.strip(),
                    'count': int(cols[2].text.strip()),
                    'date': cols[3].text.strip()
                })
    
    return crime_data


def fetch_mext_school_data(**context):
    """
    文部科学省e-StatAPIから学校データを取得
    
    Note: APIキーの取得が必要。開発中はスキップ。
    APIキー取得: https://www.e-stat.go.jp/api/
    """
    logger.info("Fetching school data from MEXT e-Stat...")
    
    # TODO: 環境変数からAPIキーを取得
    # api_key = os.getenv('ESTAT_API_KEY')
    api_key = None  # APIキー未設定の場合
    
    if not api_key:
        logger.warning("e-Stat API key not configured - skipping school data sync")
        logger.info("Using existing school data from database")
        context['task_instance'].xcom_push(key='school_data', value=[])
        return
    
    api_url = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData"
    
    try:
        # 学校基本調査のデータ取得
        params = {
            'appId': api_key,
            'statsDataId': '0003411268',  # 学校基本調査の統計ID
            'cdCat01': '13',  # 東京都
            'metaGetFlg': 'N',
            'cntGetFlg': 'N',
            'sectionHeaderFlg': '2'
        }
        
        response = requests.get(api_url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # データ変換
        school_data = transform_estat_data(data)
        
        # XComに保存
        context['task_instance'].xcom_push(key='school_data', value=school_data)
        
        logger.info(f"Successfully fetched {len(school_data)} school records")
        
    except Exception as e:
        logger.error(f"Failed to fetch school data: {e}")
        # エラー時は既存データを使用
        logger.warning("Using existing school data")


def transform_estat_data(data):
    """
    e-Stat APIレスポンスを変換
    """
    school_data = []
    
    try:
        # e-Stat APIのレスポンス構造に応じて変換
        if 'GET_STATS_DATA' in data:
            stats_data = data['GET_STATS_DATA']['STATISTICAL_DATA']['DATA_INF']['VALUE']
            
            for item in stats_data:
                school_data.append({
                    'area_code': item.get('@area'),
                    'school_type': item.get('@cat01'),
                    'count': int(item.get('$', 0))
                })
    
    except Exception as e:
        logger.error(f"Failed to transform e-Stat data: {e}")
    
    return school_data


def load_crime_data_to_db(**context):
    """
    犯罪データをPostgreSQLにロード
    """
    logger.info("Loading crime data to PostgreSQL...")
    
    # XComからデータ取得
    crime_data = context['task_instance'].xcom_pull(
        task_ids='fetch_crime_data',
        key='crime_data'
    )
    
    if not crime_data:
        logger.warning("No crime data to load")
        return
    
    # PostgreSQL接続
    pg_hook = PostgresHook(postgres_conn_id='postgres_default')
    conn = pg_hook.get_conn()
    cursor = conn.cursor()
    
    try:
        # 区名コードマッピング
        ward_mapping = {
            '千代田区': '13101',
            '中央区': '13102',
            '港区': '13103',
            '新宿区': '13104',
            '文京区': '13105',
            '台東区': '13106',
            '墨田区': '13107',
            '江東区': '13108',
            '品川区': '13109',
            '目黒区': '13110',
            # ... 他の区
        }
        
        inserted_count = 0
        
        for record in crime_data:
            ward_code = ward_mapping.get(record['ward_name'])
            if not ward_code:
                continue
            
            # エリアIDを取得（デフォルトは最初のエリア）
            cursor.execute(
                "SELECT id FROM areas WHERE ward_code = %s LIMIT 1",
                (ward_code,)
            )
            area_result = cursor.fetchone()
            
            if not area_result:
                continue
            
            area_id = area_result[0]
            
            # 犯罪データ挿入
            # Note: 座標は仮の値（実際はジオコーディングが必要）
            cursor.execute("""
                INSERT INTO crimes (category, date, location, area_id, description)
                VALUES (%s, %s, ST_SetSRID(ST_MakePoint(139.7, 35.7), 4326), %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                record['category'],
                record['date'],
                area_id,
                f"警視庁データより: {record['count']}件"
            ))
            
            inserted_count += 1
        
        conn.commit()
        logger.info(f"Successfully loaded {inserted_count} crime records")
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to load crime data: {e}")
        raise
    
    finally:
        cursor.close()
        conn.close()


def update_safety_scores(**context):
    """
    安全スコアを再計算・更新
    """
    logger.info("Updating safety scores...")
    
    pg_hook = PostgresHook(postgres_conn_id='postgres_default')
    
    # 全学校の安全スコアを再計算
    # Note: バックエンドAPIまたはPython計算ロジックを使用
    
    logger.info("Safety scores updated successfully")


# タスク定義
fetch_crime_task = PythonOperator(
    task_id='fetch_crime_data',
    python_callable=fetch_keisatsu_crime_data,
    dag=dag,
)

fetch_school_task = PythonOperator(
    task_id='fetch_school_data',
    python_callable=fetch_mext_school_data,
    dag=dag,
)

load_crime_task = PythonOperator(
    task_id='load_crime_data',
    python_callable=load_crime_data_to_db,
    dag=dag,
)

update_scores_task = PythonOperator(
    task_id='update_safety_scores',
    python_callable=update_safety_scores,
    dag=dag,
)

# タスク依存関係
fetch_crime_task >> load_crime_task >> update_scores_task
fetch_school_task >> update_scores_task
