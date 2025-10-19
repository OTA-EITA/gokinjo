-- Priority 3区データ統合投入スクリプト
-- 墨田区、江東区、品川区、目黒区の4区を一括投入
-- 実行日: 2025-10-16

\echo '=========================================='
\echo 'Priority 3区データ投入開始'
\echo '対象: 墨田区(13107), 江東区(13108), 品川区(13109), 目黒区(13110)'
\echo '=========================================='
\echo ''

-- 投入前の状態確認
\echo '【投入前の状態】'
SELECT 
    COUNT(DISTINCT ward_code) as current_wards,
    COUNT(DISTINCT s.id) as current_schools,
    COUNT(DISTINCT c.id) as current_crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id;
\echo ''

-- 墨田区データ投入
\echo '【1/4】墨田区データ投入中...'
\i /Users/ota-eita/Documents/work/gokinjo/deployment/sql/districts/priority3/sumida_district_data.sql
\echo '墨田区データ投入完了'
\echo ''

-- 江東区データ投入
\echo '【2/4】江東区データ投入中...'
\i /Users/ota-eita/Documents/work/gokinjo/deployment/sql/districts/priority3/koto_district_data.sql
\echo '江東区データ投入完了'
\echo ''

-- 品川区データ投入
\echo '【3/4】品川区データ投入中...'
\i /Users/ota-eita/Documents/work/gokinjo/deployment/sql/districts/priority3/shinagawa_district_data.sql
\echo '品川区データ投入完了'
\echo ''

-- 目黒区データ投入
\echo '【4/4】目黒区データ投入中...'
\i /Users/ota-eita/Documents/work/gokinjo/deployment/sql/districts/priority3/meguro_district_data.sql
\echo '目黒区データ投入完了'
\echo ''

-- 投入後の状態確認
\echo '=========================================='
\echo '【投入後の最終状態】'
\echo '=========================================='

-- 全体サマリー
SELECT 
    COUNT(DISTINCT ward_code) as total_wards,
    COUNT(DISTINCT s.id) as total_schools,
    COUNT(DISTINCT c.id) as total_crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id;

\echo ''
\echo '【区別データ統計】'

-- 区別詳細
SELECT 
    a.ward_code,
    CASE 
        WHEN a.ward_code = '13101' THEN '千代田区'
        WHEN a.ward_code = '13102' THEN '中央区'
        WHEN a.ward_code = '13103' THEN '港区'
        WHEN a.ward_code = '13104' THEN '新宿区'
        WHEN a.ward_code = '13105' THEN '文京区'
        WHEN a.ward_code = '13106' THEN '台東区'
        WHEN a.ward_code = '13107' THEN '墨田区'
        WHEN a.ward_code = '13108' THEN '江東区'
        WHEN a.ward_code = '13109' THEN '品川区'
        WHEN a.ward_code = '13110' THEN '目黒区'
        WHEN a.ward_code = '13111' THEN '大田区'
        WHEN a.ward_code = '13112' THEN '世田谷区'
        WHEN a.ward_code = '13113' THEN '渋谷区'
        WHEN a.ward_code = '13114' THEN '中野区'
        WHEN a.ward_code = '13122' THEN '練馬区'
        WHEN a.ward_code = '13123' THEN '江戸川区'
        ELSE '不明'
    END as ward_name,
    COUNT(DISTINCT a.id) as areas,
    COUNT(DISTINCT s.id) as schools,
    COUNT(DISTINCT c.id) as crimes,
    ROUND(AVG(GREATEST(0, 100 - (
        SELECT COUNT(*) * 10 
        FROM crimes c2 
        WHERE ST_DWithin(c2.location::geography, s.location::geography, 500)
        AND c2.date >= CURRENT_DATE - INTERVAL '3 months'
    ))), 1) as avg_safety_score
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
GROUP BY a.ward_code
ORDER BY a.ward_code;

\echo ''
\echo '【Priority 3区の詳細統計】'

-- Priority 3区の詳細
SELECT 
    a.ward_code,
    CASE 
        WHEN a.ward_code = '13107' THEN '墨田区'
        WHEN a.ward_code = '13108' THEN '江東区'
        WHEN a.ward_code = '13109' THEN '品川区'
        WHEN a.ward_code = '13110' THEN '目黒区'
    END as ward_name,
    a.name as area_name,
    COUNT(DISTINCT s.id) as schools_in_area,
    COUNT(DISTINCT c.id) as crimes_in_area
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code IN ('13107', '13108', '13109', '13110')
GROUP BY a.ward_code, a.name
ORDER BY a.ward_code, a.name;

\echo ''
\echo '【学校種別統計】'

-- 学校種別統計
SELECT 
    type as school_type,
    public_private as ownership,
    COUNT(*) as count
FROM schools
GROUP BY type, public_private
ORDER BY type, public_private;

\echo ''
\echo '【犯罪種別統計】'

-- 犯罪種別統計
SELECT 
    category as crime_category,
    COUNT(*) as count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM crimes
GROUP BY category
ORDER BY count DESC;

\echo ''
\echo '=========================================='
\echo 'Priority 3区データ投入完了'
\echo '対応区数: 8区 → 12区に拡大'
\echo 'カバレッジ: 34.8% → 52.2%に向上'
\echo '=========================================='
