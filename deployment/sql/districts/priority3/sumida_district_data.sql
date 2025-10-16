-- 墨田区データ追加（Phase 3: Priority 3区データ拡張 - 第一弾）
-- 両国、錦糸町、押上、向島エリアの学校・犯罪データ
-- 墨田区コード: 13107

-- 墨田区エリア追加
INSERT INTO areas (ward_code, town_code, name, geom) VALUES 
('13107', '001', '両国', ST_GeomFromText('POLYGON((139.787 35.694, 139.797 35.694, 139.797 35.704, 139.787 35.704, 139.787 35.694))', 4326)),
('13107', '002', '錦糸町', ST_GeomFromText('POLYGON((139.810 35.695, 139.820 35.695, 139.820 35.705, 139.810 35.705, 139.810 35.695))', 4326)),
('13107', '003', '押上', ST_GeomFromText('POLYGON((139.808 35.708, 139.818 35.708, 139.818 35.718, 139.808 35.718, 139.808 35.708))', 4326)),
('13107', '004', '向島', ST_GeomFromText('POLYGON((139.801 35.715, 139.811 35.715, 139.811 35.725, 139.801 35.725, 139.801 35.715))', 4326))
ON CONFLICT DO NOTHING;

-- 墨田区学校データ（下町文化 + 新開発エリア）
INSERT INTO schools (name, type, public_private, location, area_id, address) 
SELECT 
    name, type::school_type, public_private::school_ownership, location, 
    (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = area_town_code),
    address
FROM (VALUES
    -- 両国エリア（相撲の町・歴史ある下町）
    ('墨田区立両国小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.791 35.698)', 4326), '001', '東京都墨田区両国4-26-6'),
    ('安田学園中学校', 'junior_high', 'private', ST_GeomFromText('POINT(139.793 35.700)', 4326), '001', '東京都墨田区横網2-2-25'),
    ('両国高等学校', 'high', 'public', ST_GeomFromText('POINT(139.789 35.696)', 4326), '001', '東京都墨田区江東橋1-7-14'),
    
    -- 錦糸町エリア（商業・ビジネス地区）
    ('墨田区立錦糸小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.814 35.699)', 4326), '002', '東京都墨田区錦糸4-4-1'),
    ('墨田区立錦糸中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.816 35.701)', 4326), '002', '東京都墨田区錦糸3-1-15'),
    ('中央学院大学中央高等学校', 'high', 'private', ST_GeomFromText('POINT(139.812 35.697)', 4326), '002', '東京都墨田区江東橋3-1-6'),
    
    -- 押上エリア（スカイツリー周辺・新開発地域）
    ('墨田区立業平小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.812 35.712)', 4326), '003', '東京都墨田区業平5-7-7'),
    ('墨田区立押上小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.814 35.714)', 4326), '003', '東京都墨田区押上2-26-12'),
    ('日本大学第一中学校', 'junior_high', 'private', ST_GeomFromText('POINT(139.810 35.710)', 4326), '003', '東京都墨田区横網1-5-2'),
    
    -- 向島エリア（伝統的下町住宅地）
    ('墨田区立向島小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.805 35.719)', 4326), '004', '東京都墨田区向島1-22-17'),
    ('墨田区立寺島中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.807 35.721)', 4326), '004', '東京都墨田区東向島6-8-1'),
    ('向島学院高等学校', 'high', 'private', ST_GeomFromText('POINT(139.803 35.717)', 4326), '004', '東京都墨田区向島3-34-6')
) AS schools_data(name, type, public_private, location, area_town_code, address)
ON CONFLICT DO NOTHING;

-- 墨田区犯罪データ（下町特性 + 観光地 + 新開発地域の複合）
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
-- 両国エリア（相撲・観光・下町文化）
('窃盗', '2024-08-01', ST_GeomFromText('POINT(139.790 35.697)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '001'), '国技館周辺での観光客狙いのスリ'),
('器物損壊', '2024-08-05', ST_GeomFromText('POINT(139.794 35.701)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '001'), '江戸東京博物館前の自転車破損'),
('詐欺', '2024-08-08', ST_GeomFromText('POINT(139.792 35.699)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '001'), '相撲関連グッズの偽物販売'),
('窃盗', '2024-08-12', ST_GeomFromText('POINT(139.788 35.695)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '001'), 'ちゃんこ料理店での置き引き'),
('暴行', '2024-08-15', ST_GeomFromText('POINT(139.795 35.702)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '001'), '酒場での客同士のトラブル'),

-- 錦糸町エリア（繁華街・商業地区）
('窃盗', '2024-08-02', ST_GeomFromText('POINT(139.813 35.698)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '002'), 'JR錦糸町駅構内での置き引き'),
('詐欺', '2024-08-06', ST_GeomFromText('POINT(139.817 35.702)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '002'), '繁華街でのぼったくり'),
('器物損壊', '2024-08-09', ST_GeomFromText('POINT(139.815 35.700)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '002'), 'パチンコ店駐車場での車両損傷'),
('窃盗', '2024-08-14', ST_GeomFromText('POINT(139.811 35.696)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '002'), 'デパート内での万引き'),
('暴行', '2024-08-18', ST_GeomFromText('POINT(139.819 35.703)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '002'), '深夜の飲み屋街でのトラブル'),
('詐欺', '2024-08-20', ST_GeomFromText('POINT(139.812 35.697)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '002'), 'キャッチセールス詐欺'),

-- 押上エリア（スカイツリー観光地・新開発）
('窃盗', '2024-08-03', ST_GeomFromText('POINT(139.811 35.711)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '003'), '東京スカイツリー周辺での観光客スリ'),
('器物損壊', '2024-08-07', ST_GeomFromText('POINT(139.815 35.715)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '003'), 'ソラマチでの器物破損'),
('詐欺', '2024-08-11', ST_GeomFromText('POINT(139.813 35.713)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '003'), '観光地でのニセモノ土産品販売'),
('窃盗', '2024-08-16', ST_GeomFromText('POINT(139.809 35.709)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '003'), '新築マンション駐輪場での自転車盗難'),
('器物損壊', '2024-08-19', ST_GeomFromText('POINT(139.817 35.716)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '003'), '公園の遊具への落書き'),

-- 向島エリア（伝統的住宅街・下町）
('窃盗', '2024-08-04', ST_GeomFromText('POINT(139.804 35.718)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '004'), '住宅街での自転車盗難'),
('器物損壊', '2024-08-10', ST_GeomFromText('POINT(139.808 35.722)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '004'), '商店街の看板損傷'),
('詐欺', '2024-08-13', ST_GeomFromText('POINT(139.806 35.720)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '004'), '高齢者狙いの訪問販売詐欺'),
('窃盗', '2024-08-17', ST_GeomFromText('POINT(139.802 35.716)', 4326), (SELECT id FROM areas WHERE ward_code = '13107' AND town_code = '004'), '銭湯での貴重品盗難')
ON CONFLICT DO NOTHING;

-- データ投入結果確認
DO $$
BEGIN
    RAISE NOTICE '=== 墨田区データ追加結果（Phase 3-1） ===';
END
$$;

SELECT 
    '墨田区' as ward_name,
    '13107' as ward_code,
    COUNT(DISTINCT a.id) as areas_count,
    COUNT(DISTINCT s.id) as schools_count,
    COUNT(DISTINCT c.id) as crimes_count
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code = '13107';

-- 墨田区の安全性スコア確認
SELECT 
    s.name as school_name,
    s.type as school_type,
    s.public_private,
    a.name as area_name,
    COUNT(c.id) as crimes_within_500m,
    GREATEST(0, 100 - (COUNT(c.id) * 10)) as safety_score_estimate
FROM schools s
JOIN areas a ON s.area_id = a.id
LEFT JOIN crimes c ON ST_DWithin(
    c.location::geography,
    s.location::geography,
    500  -- 500m radius
)
WHERE a.ward_code = '13107'  -- 墨田区のみ
AND c.date >= '2024-06-01'  -- 最近3ヶ月
GROUP BY s.id, s.name, s.type, s.public_private, a.name
ORDER BY safety_score_estimate ASC, s.name;

-- 全対応区数の確認
SELECT 
    COUNT(DISTINCT ward_code) as total_wards,
    array_agg(DISTINCT ward_code ORDER BY ward_code) as ward_codes
FROM areas;

COMMIT;