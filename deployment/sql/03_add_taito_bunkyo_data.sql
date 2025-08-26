-- 台東区・文京区データ追加スクリプト
-- 実行方法: \i /docker-entrypoint-initdb.d/add_taito_bunkyo_data.sql

BEGIN;

-- 台東区エリア追加（浅草、上野等の主要エリア）
INSERT INTO areas (ward_code, town_code, name, geom) VALUES 
('13106', '001', '浅草', ST_GeomFromText('POLYGON((139.793 35.712, 139.803 35.712, 139.803 35.722, 139.793 35.722, 139.793 35.712))', 4326)),
('13106', '002', '上野', ST_GeomFromText('POLYGON((139.773 35.707, 139.783 35.707, 139.783 35.717, 139.773 35.717, 139.773 35.707))', 4326)),
('13106', '003', '浅草橋', ST_GeomFromText('POLYGON((139.785 35.695, 139.795 35.695, 139.795 35.705, 139.785 35.705, 139.785 35.695))', 4326)),
('13106', '004', '蔵前', ST_GeomFromText('POLYGON((139.790 35.700, 139.800 35.700, 139.800 35.710, 139.790 35.710, 139.790 35.700))', 4326))
ON CONFLICT DO NOTHING;

-- 文京区エリア追加（本郷、湯島等の文教地区）
INSERT INTO areas (ward_code, town_code, name, geom) VALUES 
('13105', '001', '本郷', ST_GeomFromText('POLYGON((139.755 35.707, 139.765 35.707, 139.765 35.717, 139.755 35.717, 139.755 35.707))', 4326)),
('13105', '002', '湯島', ST_GeomFromText('POLYGON((139.768 35.705, 139.778 35.705, 139.778 35.715, 139.768 35.715, 139.768 35.705))', 4326)),
('13105', '003', '千駄木', ST_GeomFromText('POLYGON((139.760 35.722, 139.770 35.722, 139.770 35.732, 139.760 35.732, 139.760 35.722))', 4326)),
('13105', '004', '根津', ST_GeomFromText('POLYGON((139.763 35.720, 139.773 35.720, 139.773 35.730, 139.763 35.730, 139.763 35.720))', 4326))
ON CONFLICT DO NOTHING;

-- 台東区学校データ（歴史と伝統の下町エリア）
INSERT INTO schools (name, type, public_private, location, area_id, address) 
SELECT 
    name, type::school_type, public_private::school_ownership, location, 
    (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = area_town_code),
    address
FROM (VALUES
    -- 浅草エリア
    ('台東区立浅草小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.797 35.716)', 4326), '001', '東京都台東区浅草2-25-16'),
    ('浅草寺幼稚園', 'elementary', 'private', ST_GeomFromText('POINT(139.795 35.714)', 4326), '001', '東京都台東区浅草2-3-1'),
    
    -- 上野エリア
    ('台東区立上野小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.777 35.711)', 4326), '002', '東京都台東区東上野6-16-8'),
    ('上野学園中学校', 'junior_high', 'private', ST_GeomFromText('POINT(139.779 35.713)', 4326), '002', '東京都台東区東上野4-24-12'),
    ('岩倉高等学校', 'high', 'private', ST_GeomFromText('POINT(139.775 35.709)', 4326), '002', '東京都台東区上野7-8-8'),
    
    -- 浅草橋エリア
    ('台東区立浅草橋小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.789 35.699)', 4326), '003', '東京都台東区浅草橋2-17-7'),
    
    -- 蔵前エリア
    ('台東区立蔵前小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.794 35.704)', 4326), '004', '東京都台東区蔵前4-19-15')
) AS schools_data(name, type, public_private, location, area_town_code, address)
ON CONFLICT DO NOTHING;

-- 文京区学校データ（文教地区の名門校）
INSERT INTO schools (name, type, public_private, location, area_id, address) 
SELECT 
    name, type::school_type, public_private::school_ownership, location,
    (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = area_town_code),
    address
FROM (VALUES
    -- 本郷エリア
    ('文京区立本郷小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.759 35.711)', 4326), '001', '東京都文京区本郷4-5-15'),
    ('郁文館中学校', 'junior_high', 'private', ST_GeomFromText('POINT(139.761 35.713)', 4326), '001', '東京都文京区向丘2-19-1'),
    ('東京大学教育学部附属中等教育学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.757 35.709)', 4326), '001', '東京都文京区大塚1-9-24'),
    
    -- 湯島エリア
    ('文京区立湯島小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.772 35.709)', 4326), '002', '東京都文京区湯島2-28-14'),
    ('湯島聖堂孔子廟学童保育所', 'elementary', 'private', ST_GeomFromText('POINT(139.774 35.711)', 4326), '002', '東京都文京区湯島1-4-25'),
    
    -- 千駄木エリア
    ('文京区立千駄木小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.764 35.726)', 4326), '003', '東京都文京区千駄木2-19-22'),
    ('日本医科大学付属高等学校', 'high', 'private', ST_GeomFromText('POINT(139.766 35.728)', 4326), '003', '東京都文京区千駄木1-1-5'),
    
    -- 根津エリア
    ('文京区立根津小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.767 35.724)', 4326), '004', '東京都文京区根津2-14-16')
) AS schools_data(name, type, public_private, location, area_town_code, address)
ON CONFLICT DO NOTHING;

-- 台東区犯罪データ（観光地特有の犯罪傾向）
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
-- 浅草エリア（観光地特性 - 外国人観光客も多い）
('窃盗', '2024-08-01', ST_GeomFromText('POINT(139.796 35.715)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '001'), '浅草寺境内での観光客狙いのスリ'),
('詐欺', '2024-08-03', ST_GeomFromText('POINT(139.798 35.717)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '001'), '仲見世通りでの偽物販売'),
('器物損壊', '2024-08-05', ST_GeomFromText('POINT(139.794 35.713)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '001'), '雷門周辺での落書き'),
('窃盗', '2024-08-08', ST_GeomFromText('POINT(139.799 35.718)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '001'), '観光バス駐車場での置き引き'),
('暴行', '2024-08-10', ST_GeomFromText('POINT(139.795 35.712)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '001'), '酔客同士のトラブル'),
('窃盗', '2024-08-15', ST_GeomFromText('POINT(139.797 35.716)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '001'), 'ホテル客室からの金品盗難'),

-- 上野エリア（文化施設・商業地域）
('窃盗', '2024-08-02', ST_GeomFromText('POINT(139.776 35.710)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '002'), '上野動物園での財布盗難'),
('器物損壊', '2024-08-06', ST_GeomFromText('POINT(139.778 35.712)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '002'), '国立博物館周辺での自転車破損'),
('詐欺', '2024-08-09', ST_GeomFromText('POINT(139.780 35.714)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '002'), 'アメ横でのチケット詐欺'),
('窃盗', '2024-08-12', ST_GeomFromText('POINT(139.774 35.708)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '002'), '上野駅構内での置き引き'),
('暴行', '2024-08-18', ST_GeomFromText('POINT(139.781 35.715)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '002'), '飲み屋街での口論トラブル'),

-- 浅草橋エリア（問屋街・オフィス）
('窃盗', '2024-08-04', ST_GeomFromText('POINT(139.788 35.698)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '003'), '問屋街での商品盗難'),
('器物損壊', '2024-08-11', ST_GeomFromText('POINT(139.791 35.701)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '003'), 'オフィスビル駐輪場での破損'),
('詐欺', '2024-08-16', ST_GeomFromText('POINT(139.787 35.697)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '003'), '卸売業者への振り込め詐欺'),

-- 蔵前エリア（伝統工芸・住宅）
('窃盗', '2024-08-07', ST_GeomFromText('POINT(139.793 35.703)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '004'), '工芸品店での万引き'),
('器物損壊', '2024-08-14', ST_GeomFromText('POINT(139.796 35.706)', 4326), (SELECT id FROM areas WHERE ward_code = '13106' AND town_code = '004'), '住宅街での車両損傷')
ON CONFLICT DO NOTHING;

-- 文京区犯罪データ（文教地区の静穏な環境）
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
-- 本郷エリア（大学街・住宅地）
('窃盗', '2024-08-01', ST_GeomFromText('POINT(139.758 35.710)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '001'), '大学図書館での財布盗難'),
('器物損壊', '2024-08-05', ST_GeomFromText('POINT(139.762 35.714)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '001'), '学生寮周辺での落書き'),
('詐欺', '2024-08-12', ST_GeomFromText('POINT(139.760 35.712)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '001'), '大学生狙いの投資詐欺'),
('窃盗', '2024-08-18', ST_GeomFromText('POINT(139.756 35.708)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '001'), 'カフェでのノートPC盗難'),

-- 湯島エリア（神社・文化施設）
('窃盗', '2024-08-03', ST_GeomFromText('POINT(139.771 35.708)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '002'), '湯島天神での賽銭泥棒'),
('器物損壊', '2024-08-08', ST_GeomFromText('POINT(139.775 35.712)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '002'), '文化施設での設備破損'),
('詐欺', '2024-08-15', ST_GeomFromText('POINT(139.773 35.710)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '002'), '合格祈願グッズ詐欺'),

-- 千駄木エリア（静かな住宅街）
('窃盗', '2024-08-06', ST_GeomFromText('POINT(139.765 35.727)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '003'), '住宅街での自転車盗難'),
('器物損壊', '2024-08-13', ST_GeomFromText('POINT(139.767 35.729)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '003'), '公園での遊具破損'),

-- 根津エリア（下町住宅地）
('窃盗', '2024-08-09', ST_GeomFromText('POINT(139.768 35.725)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '004'), '商店街でのレジ金盗難'),
('器物損壊', '2024-08-17', ST_GeomFromText('POINT(139.766 35.723)', 4326), (SELECT id FROM areas WHERE ward_code = '13105' AND town_code = '004'), '住宅の外壁への落書き')
ON CONFLICT DO NOTHING;

-- データ投入結果表示
DO $$
BEGIN
    RAISE NOTICE '=== 台東区・文京区データ追加完了 ===';
    RAISE NOTICE '台東区: 4エリア, 7学校, 15犯罪データ';
    RAISE NOTICE '文京区: 4エリア, 8学校, 10犯罪データ';
    RAISE NOTICE '合計: 8エリア, 15学校, 25犯罪データを追加';
END
$$;

COMMIT;

-- 投入結果確認クエリ
SELECT 
    '台東区' as ward_name,
    COUNT(DISTINCT a.id) as areas_count,
    COUNT(DISTINCT s.id) as schools_count,
    COUNT(DISTINCT c.id) as crimes_count
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code = '13106'

UNION ALL

SELECT 
    '文京区' as ward_name,
    COUNT(DISTINCT a.id) as areas_count,
    COUNT(DISTINCT s.id) as schools_count,
    COUNT(DISTINCT c.id) as crimes_count
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code = '13105'

UNION ALL

SELECT 
    '全体合計' as ward_name,
    COUNT(DISTINCT a.id) as areas_count,
    COUNT(DISTINCT s.id) as schools_count,
    COUNT(DISTINCT c.id) as crimes_count
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id;
