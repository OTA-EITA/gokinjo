# Priority 3区データ拡張 - 実行ガイド

## 概要

**目的**: 東京23区のカバレッジを34.8%から52.2%に拡大  
**対象区**: 墨田区、江東区、品川区、目黒区（4区）  
**追加データ**: 
- エリア: 20箇所
- 学校: 72校
- 犯罪データ: 約100件

---

## 実行前の準備

### 1. システム起動確認

```bash
cd /Users/ota-eita/Documents/work/gokinjo

# 全サービスが起動しているか確認
make status

# 必要に応じて起動
make start
```

### 2. 現在のデータ状態確認

```bash
# データベースに接続
make db-shell

# 現在の統計を確認
SELECT 
    COUNT(DISTINCT ward_code) as current_wards,
    COUNT(DISTINCT s.id) as current_schools,
    COUNT(DISTINCT c.id) as current_crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id;

# 終了
\q
```

**期待される結果**:
- current_wards: 13（既存の区数）
- current_schools: 28
- current_crimes: 142

---

## データ投入手順

### オプション1: 一括投入（推奨）

```bash
# PostgreSQLに接続してスクリプト実行
docker exec -i gokinjo-db-1 psql -U postgres -d tokyo_crime_school \
  < deployment/sql/districts/priority3/load_all_priority3.sql
```

### オプション2: 個別投入

各区を個別に投入する場合：

```bash
# 墨田区
docker exec -i gokinjo-db-1 psql -U postgres -d tokyo_crime_school \
  < deployment/sql/districts/priority3/sumida_district_data.sql

# 江東区
docker exec -i gokinjo-db-1 psql -U postgres -d tokyo_crime_school \
  < deployment/sql/districts/priority3/koto_district_data.sql

# 品川区
docker exec -i gokinjo-db-1 psql -U postgres -d tokyo_crime_school \
  < deployment/sql/districts/priority3/shinagawa_district_data.sql

# 目黒区
docker exec -i gokinjo-db-1 psql -U postgres -d tokyo_crime_school \
  < deployment/sql/districts/priority3/meguro_district_data.sql
```

---

## データ投入後の確認

### 1. データベース統計確認

```bash
make db-shell

# 全体統計
SELECT 
    COUNT(DISTINCT ward_code) as total_wards,
    COUNT(DISTINCT s.id) as total_schools,
    COUNT(DISTINCT c.id) as total_crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id;
```

**期待される結果**:
- total_wards: 17（13 + 4）
- total_schools: 100校（28 + 72）
- total_crimes: 240件（142 + 100）

### 2. Priority 3区の詳細確認

```sql
-- Priority 3区のデータ確認
SELECT 
    a.ward_code,
    CASE 
        WHEN a.ward_code = '13107' THEN '墨田区'
        WHEN a.ward_code = '13108' THEN '江東区'
        WHEN a.ward_code = '13109' THEN '品川区'
        WHEN a.ward_code = '13110' THEN '目黒区'
    END as ward_name,
    COUNT(DISTINCT a.id) as areas,
    COUNT(DISTINCT s.id) as schools,
    COUNT(DISTINCT c.id) as crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code IN ('13107', '13108', '13109', '13110')
GROUP BY a.ward_code
ORDER BY a.ward_code;
```

**期待される結果**:

| ward_code | ward_name | areas | schools | crimes |
|-----------|-----------|-------|---------|--------|
| 13107     | 墨田区    | 4     | 12      | 19     |
| 13108     | 江東区    | 6     | 22      | 32     |
| 13109     | 品川区    | 5     | 19      | 27     |
| 13110     | 目黒区    | 5     | 19      | 24     |

### 3. API動作確認

```bash
# 墨田区の学校データ取得
curl "http://localhost:8081/api/schools?ward_code=13107" | jq

# 江東区の犯罪データ取得
curl "http://localhost:8081/api/crimes?ward_code=13108" | jq

# 品川区の統計取得
curl "http://localhost:8081/api/statistics?ward_code=13109" | jq

# 目黒区の学校取得
curl "http://localhost:8081/api/schools?ward_code=13110" | jq
```

### 4. フロントエンド動作確認

1. ブラウザで http://localhost:3001 を開く
2. 地図上で新しい4区が表示されることを確認
3. 各区をクリックしてデータが読み込まれることを確認
4. 検索機能で新しい学校が検索できることを確認

---

## データ内訳詳細

### 墨田区（13107）

**エリア**: 4箇所
- 両国（国技館・江戸東京博物館）
- 錦糸町（商業地区）
- 押上（東京スカイツリー）
- 向島（伝統的下町）

**学校**: 12校
- 小学校: 5校
- 中学校: 4校
- 高校: 3校

**犯罪**: 19件
- 窃盗: 9件
- 詐欺: 4件
- 器物損壊: 5件
- 暴行: 1件

### 江東区（13108）

**エリア**: 6箇所
- 豊洲（湾岸開発地域）
- お台場（観光地）
- 亀戸（商店街）
- 門前仲町（下町文化）
- 木場（公園・住宅地）
- 東陽町（オフィス街）

**学校**: 22校
- 小学校: 11校
- 中学校: 7校
- 高校: 4校

**犯罪**: 32件
- 窃盗: 16件
- 詐欺: 8件
- 器物損壊: 7件
- 暴行: 1件

### 品川区（13109）

**エリア**: 5箇所
- 大井町（商業地区）
- 五反田（オフィス街）
- 天王洲（再開発地区）
- 戸越（商店街）
- 武蔵小山（住宅地）

**学校**: 19校
- 小学校: 9校
- 中学校: 6校
- 高校: 4校

**犯罪**: 27件
- 窃盗: 13件
- 詐欺: 7件
- 器物損壊: 6件
- 暴行: 1件

### 目黒区（13110）

**エリア**: 5箇所
- 自由が丘（高級住宅地）
- 中目黒（文化地区）
- 学芸大学（文教地区）
- 祐天寺（住宅地）
- 都立大学（文教地区）

**学校**: 19校
- 小学校: 9校
- 中学校: 6校
- 高校: 4校

**犯罪**: 24件
- 窃盗: 12件
- 詐欺: 6件
- 器物損壊: 5件
- 暴行: 1件

---

## トラブルシューティング

### エラー: "duplicate key value violates unique constraint"

**原因**: データが既に投入されている

**解決策**:
```sql
-- 既存のPriority 3区データを削除
DELETE FROM crimes WHERE area_id IN (
    SELECT id FROM areas WHERE ward_code IN ('13107', '13108', '13109', '13110')
);
DELETE FROM schools WHERE area_id IN (
    SELECT id FROM areas WHERE ward_code IN ('13107', '13108', '13109', '13110')
);
DELETE FROM areas WHERE ward_code IN ('13107', '13108', '13109', '13110');

-- 再投入
\i deployment/sql/districts/priority3/load_all_priority3.sql
```

### APIでデータが取得できない

**確認事項**:
1. APIサーバーが起動しているか: `curl http://localhost:8081/health`
2. データベースに接続できるか: `make db-shell`
3. データが投入されているか: 上記のSQLで確認

**解決策**:
```bash
# APIサーバー再起動
docker restart gokinjo-api-1

# ログ確認
docker logs gokinjo-api-1
```

### フロントエンドで地図が表示されない

**確認事項**:
1. フロントエンドが起動しているか: http://localhost:3001
2. GeoJSONファイルが更新されているか
3. ブラウザのキャッシュをクリア

**解決策**:
```bash
# フロントエンド再起動
cd frontend
npm run dev
```

---

## 成功指標

### データ投入完了

- [ ] データベースに4区のデータが投入されている
- [ ] 全体で17区のデータが存在する
- [ ] 学校数が100校程度
- [ ] 犯罪データが240件程度

### 機能動作確認

- [ ] 地図上に4区の境界が表示される
- [ ] 各区をクリックするとデータが読み込まれる
- [ ] 検索で新しい学校が見つかる
- [ ] 統計ダッシュボードに4区のデータが反映される
- [ ] エリア比較で4区が選択できる

### パフォーマンス

- [ ] ページ読み込み時間 < 3秒
- [ ] API応答時間 < 2秒
- [ ] 地図操作がスムーズ

---

## 次のステップ

Priority 3区の投入完了後:

1. **Priority 4区の準備** (大田区、杉並区、豊島区、北区)
2. **実データAPI統合** (警視庁オープンデータ)
3. **高度な分析機能** (AI予測モデル)
4. **AWS EKSデプロイ準備**

---

**実行日**: 2025-10-16  
**作成者**: Claude  
**ステータス**: 準備完了 - 即座実行可能
