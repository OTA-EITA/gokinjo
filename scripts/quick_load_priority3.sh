#!/bin/bash
# Priority 3区データ投入 - クイック実行スクリプト
# 実行: ./scripts/quick_load_priority3.sh

set -e  # エラーで停止

echo "=========================================="
echo "Priority 3区データ投入スクリプト"
echo "対象: 墨田区、江東区、品川区、目黒区"
echo "=========================================="
echo ""

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# 環境確認
echo "【Step 1】環境確認..."
if ! docker ps | grep -q deployment-postgis-1; then
    echo "エラー: PostgreSQLコンテナが起動していません"
    echo "先に 'make start' を実行してください"
    exit 1
fi
echo "PostgreSQL: 起動確認 OK"
echo ""

# 現在のデータ状態確認
echo "【Step 2】投入前のデータ状態確認..."
docker exec deployment-postgis-1 psql -U postgres -d neighborhood_mapping -c "
    SELECT 
        '投入前' as timing,
        COUNT(DISTINCT ward_code) as wards,
        COUNT(DISTINCT s.id) as schools,
        COUNT(DISTINCT c.id) as crimes
    FROM areas a
    LEFT JOIN schools s ON s.area_id = a.id
    LEFT JOIN crimes c ON c.area_id = a.id;
"
echo ""

# 確認プロンプト
read -p "Priority 3区データを投入しますか? (y/n): " answer
if [ "$answer" != "y" ]; then
    echo "キャンセルしました"
    exit 0
fi
echo ""

# データ投入
echo "【Step 3】Priority 3区データ投入中..."
echo ""

# 墨田区
echo "  [1/4] 墨田区データ投入..."
docker exec -i deployment-postgis-1 psql -U postgres -d neighborhood_mapping \
    < deployment/sql/districts/priority3/sumida_district_data.sql > /dev/null 2>&1
echo "  ✓ 墨田区データ投入完了"

# 江東区
echo "  [2/4] 江東区データ投入..."
docker exec -i deployment-postgis-1 psql -U postgres -d neighborhood_mapping \
    < deployment/sql/districts/priority3/koto_district_data.sql > /dev/null 2>&1
echo "  ✓ 江東区データ投入完了"

# 品川区
echo "  [3/4] 品川区データ投入..."
docker exec -i deployment-postgis-1 psql -U postgres -d neighborhood_mapping \
    < deployment/sql/districts/priority3/shinagawa_district_data.sql > /dev/null 2>&1
echo "  ✓ 品川区データ投入完了"

# 目黒区
echo "  [4/4] 目黒区データ投入..."
docker exec -i deployment-postgis-1 psql -U postgres -d neighborhood_mapping \
    < deployment/sql/districts/priority3/meguro_district_data.sql > /dev/null 2>&1
echo "  ✓ 目黒区データ投入完了"

echo ""
echo "【Step 4】投入後のデータ検証..."

# 全体統計
docker exec deployment-postgis-1 psql -U postgres -d neighborhood_mapping -c "
    SELECT 
        '投入後' as timing,
        COUNT(DISTINCT ward_code) as wards,
        COUNT(DISTINCT s.id) as schools,
        COUNT(DISTINCT c.id) as crimes
    FROM areas a
    LEFT JOIN schools s ON s.area_id = a.id
    LEFT JOIN crimes c ON c.area_id = a.id;
"

echo ""

# Priority 3区別統計
docker exec deployment-postgis-1 psql -U postgres -d neighborhood_mapping -c "
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
"

echo ""
echo "=========================================="
echo "Priority 3区データ投入完了"
echo "=========================================="
echo ""
echo "次のステップ:"
echo "1. フロントエンドで確認: http://localhost:3001"
echo "2. API動作確認: curl http://localhost:8081/api/schools?ward_code=13107"
echo "3. データ詳細確認: make verify-priority3"
echo ""
