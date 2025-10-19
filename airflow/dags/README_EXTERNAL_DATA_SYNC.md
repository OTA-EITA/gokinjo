# External Data Sync DAG - セットアップガイド

## 概要

警視庁と文部科学省から公式データを自動取得するAirflow DAGです。

**現在の状態**: 開発モード（モックデータ使用）

## DAG構成

```
external_data_sync (週次実行: 毎週月曜 2:00 AM)
├── fetch_crime_data      (警視庁データ取得)
├── fetch_school_data     (文科省データ取得)
├── load_crime_data       (PostgreSQL投入)
└── update_safety_scores  (安全スコア再計算)
```

## 開発モード vs 本番モード

### 開発モード（現在）
- **警視庁データ**: モックデータを返す（実際のURLは404）
- **文科省データ**: API未設定時はスキップ
- **エラー処理**: エラーでも続行（開発継続のため）

### 本番モード（要設定）
実際のデータソースを使用するには以下の設定が必要：

#### 1. 警視庁オープンデータ
**公式サイト**: https://www.keishicho.metro.tokyo.lg.jp/about_mpd/joho/open_data.html

**データ形式**: CSV/Excel ダウンロード形式

**実装方法**:
- オプションA: 手動ダウンロード → S3アップロード → Airflowで処理
- オプションB: スクレイピング（要ページ構造調査）
- オプションC: API公開待ち

#### 2. 文科省e-Stat API
**公式サイト**: https://www.e-stat.go.jp/api/

**APIキー取得手順**:
```bash
1. https://www.e-stat.go.jp/api/ にアクセス
2. 利用登録
3. APIキー発行
4. 環境変数に設定:
   export ESTAT_API_KEY="your_api_key_here"
```

## 現在の動作

### モックデータ例
```python
# 警視庁データ（fetch_crime_data）
crime_data = [
    {
        'ward_name': '墨田区',
        'category': '窃盗',
        'count': 5,
        'date': '2025-10-19'
    },
    {
        'ward_name': '江東区',
        'category': '詐欺',
        'count': 3,
        'date': '2025-10-19'
    }
]

# 文科省データ（fetch_school_data）
# APIキー未設定時は空配列を返してスキップ
school_data = []
```

## DAG実行方法

### 手動実行
```bash
# Airflow起動
make airflow-start

# DAG確認
make airflow-list-dags

# 手動トリガー
cd airflow
docker-compose -f docker-compose.airflow.yml exec airflow-webserver \
  airflow dags trigger external_data_sync

# ログ確認
docker-compose -f docker-compose.airflow.yml logs -f airflow-scheduler
```

### Web UI実行
1. http://localhost:8082 にアクセス
2. ログイン: admin / admin
3. DAG `external_data_sync` を探す
4. 右側の再生ボタンをクリック
5. "Trigger DAG" を選択

## トラブルシューティング

### エラー: 404 Not Found (警視庁URL)

**原因**: 仮のURLが実際には存在しない

**対応**: 
- 現在はモックデータで動作（開発モード）
- 実際のデータソース確定後に実装更新

**確認**:
```bash
# ログで "Using mock data" を確認
make airflow-logs
```

### エラー: e-Stat API key not configured

**原因**: APIキー未設定

**対応**:
- 開発中は問題なし（スキップして継続）
- 本番運用時は上記手順でAPIキー取得・設定

## 本番運用への移行手順

### Step 1: データソース調査

**警視庁**:
```bash
# 実際のCSV URLを確認
curl -I https://www.keishicho.metro.tokyo.lg.jp/about_mpd/joho/open_data.html

# ダウンロード可能なCSVファイルのURLを特定
```

**文科省**:
```bash
# e-Stat APIキー取得
# https://www.e-stat.go.jp/api/ で登録
```

### Step 2: DAG更新

`airflow/dags/external_data_sync_dag.py` を編集:

```python
# 警視庁データ取得（実際のURL使用）
def fetch_keisatsu_crime_data(**context):
    # TODO部分を実際の実装に置き換え
    response = requests.get(
        "https://www.keishicho.metro.tokyo.lg.jp/actual/csv/url.csv",
        headers={'User-Agent': 'TokyoSchoolSafetyApp/1.0'}
    )
    
    # CSVパース
    import io
    df = pd.read_csv(io.StringIO(response.text))
    crime_data = df.to_dict('records')
    ...
```

### Step 3: 環境変数設定

```bash
# Airflow環境変数設定
cd airflow
echo "ESTAT_API_KEY=your_actual_api_key" >> .env

# Airflow再起動
docker-compose -f docker-compose.airflow.yml down
docker-compose -f docker-compose.airflow.yml up -d
```

### Step 4: テスト実行

```bash
# DAG手動実行
make airflow-run-dag DAG_ID=external_data_sync

# 結果確認
make db-shell
SELECT * FROM crimes WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

## 現在の推奨アクション

### 開発継続（現状維持）
- モックデータで開発継続
- フロントエンド機能実装に注力
- データソース調査は並行作業

### データソース準備（並行作業）
1. 警視庁オープンデータサイトでCSV所在確認
2. e-Stat APIキー取得（無料）
3. 実際のデータ構造を確認

### 実装完了目標
- **短期**: モックデータで全機能動作確認
- **中期**: 警視庁CSVマニュアル統合
- **長期**: 完全自動化（週次実行）

## 参考リンク

- 警視庁オープンデータ: https://www.keishicho.metro.tokyo.lg.jp/about_mpd/joho/open_data.html
- e-Stat API: https://www.e-stat.go.jp/api/
- Airflow公式ドキュメント: https://airflow.apache.org/docs/

---

**最終更新**: 2025-10-19  
**ステータス**: 開発モード（モックデータ使用）  
**次のアクション**: データソース調査 or フロントエンド機能実装継続
