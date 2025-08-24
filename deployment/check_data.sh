#!/bin/bash
# データベース状態確認スクリプト
# 使用方法: ./check_data.sh

echo "🔍 データベース状態を確認しています..."

cd "$(dirname "$0")"

# データ確認SQL
CHECK_SQL="
SELECT 
    '対応区数' as metric,
    COUNT(DISTINCT ward_code)::text as value
FROM areas
UNION ALL
SELECT 
    'エリア数' as metric,
    COUNT(*)::text as value
FROM areas
UNION ALL
SELECT 
    '学校数' as metric,
    COUNT(*)::text as value
FROM schools
UNION ALL
SELECT 
    '犯罪データ' as metric,
    COUNT(*)::text as value
FROM crimes
UNION ALL
SELECT 
    '台東区エリア' as metric,
    COUNT(*)::text as value
FROM areas WHERE ward_code = '13106'
UNION ALL
SELECT 
    '文京区エリア' as metric,
    COUNT(*)::text as value
FROM areas WHERE ward_code = '13105';
"

echo "$CHECK_SQL" | docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping

echo ""
echo "詳細情報:"

DETAIL_SQL="
SELECT 
    a.name as area_name,
    COUNT(DISTINCT s.id) as schools,
    COUNT(DISTINCT c.id) as crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code IN ('13106', '13105')
GROUP BY a.id, a.name, a.ward_code
ORDER BY a.ward_code, a.town_code;
"

echo "$DETAIL_SQL" | docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping
