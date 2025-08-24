-- 渋谷区・港区データ追加
-- Phase 1: データ拡張の第一弾

-- 渋谷区エリア追加
INSERT INTO areas (ward_code, town_code, name, geom) VALUES 
('13113', '001', '渋谷', ST_GeomFromText('POLYGON((139.695 35.655, 139.705 35.655, 139.705 35.665, 139.695 35.665, 139.695 35.655))', 4326)),
('13113', '002', '道玄坂', ST_GeomFromText('POLYGON((139.693 35.657, 139.703 35.657, 139.703 35.667, 139.693 35.667, 139.693 35.657))', 4326)),
('13113', '003', '宇田川町', ST_GeomFromText('POLYGON((139.697 35.660, 139.707 35.660, 139.707 35.670, 139.697 35.670, 139.697 35.660))', 4326))
ON CONFLICT DO NOTHING;

-- 港区エリア追加
INSERT INTO areas (ward_code, town_code, name, geom) VALUES 
('13103', '001', '六本木', ST_GeomFromText('POLYGON((139.730 35.662, 139.740 35.662, 139.740 35.672, 139.730 35.672, 139.730 35.662))', 4326)),
('13103', '002', '青山', ST_GeomFromText('POLYGON((139.715 35.670, 139.725 35.670, 139.725 35.680, 139.715 35.680, 139.715 35.670))', 4326)),
('13103', '003', '赤坂', ST_GeomFromText('POLYGON((139.735 35.675, 139.745 35.675, 139.745 35.685, 139.735 35.685, 139.735 35.675))', 4326))
ON CONFLICT DO NOTHING;

-- 渋谷区学校データ
INSERT INTO schools (name, type, public_private, location, area_id) 
SELECT 
    name, type::school_type, public_private::school_ownership, location, 
    (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = area_town_code)
FROM (VALUES
    ('渋谷区立渋谷小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.699 35.659)', 4326), '001'),
    ('渋谷区立道玄坂小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.697 35.661)', 4326), '002'),
    ('青山学院中等部', 'junior_high', 'private', ST_GeomFromText('POINT(139.701 35.664)', 4326), '003'),
    ('渋谷教育学園渋谷中学校', 'junior_high', 'private', ST_GeomFromText('POINT(139.703 35.666)', 4326), '001')
) AS schools_data(name, type, public_private, location, area_town_code)
ON CONFLICT DO NOTHING;

-- 港区学校データ
INSERT INTO schools (name, type, public_private, location, area_id) 
SELECT 
    name, type::school_type, public_private::school_ownership, location,
    (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = area_town_code)
FROM (VALUES
    ('港区立六本木小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.734 35.666)', 4326), '001'),
    ('港区立青山小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.719 35.674)', 4326), '002'),
    ('麻布中学校', 'junior_high', 'private', ST_GeomFromText('POINT(139.737 35.668)', 4326), '001'),
    ('慶應義塾中等部', 'junior_high', 'private', ST_GeomFromText('POINT(139.739 35.679)', 4326), '003')
) AS schools_data(name, type, public_private, location, area_town_code)
ON CONFLICT DO NOTHING;

-- 渋谷区犯罪データ（最近3ヶ月分）
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
-- 渋谷エリア（繁華街特性）
('窃盗', '2024-08-01', ST_GeomFromText('POINT(139.701 35.661)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '001'), 'スクランブル交差点付近でのスリ'),
('暴行', '2024-08-03', ST_GeomFromText('POINT(139.702 35.662)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '001'), '深夜の路上トラブル'),
('器物損壊', '2024-08-05', ST_GeomFromText('POINT(139.700 35.660)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '001'), '電柱への落書き'),
('窃盗', '2024-08-08', ST_GeomFromText('POINT(139.703 35.663)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '001'), '駅構内での置き引き'),
('詐欺', '2024-08-10', ST_GeomFromText('POINT(139.698 35.658)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '001'), 'キャッチセールス詐欺'),

-- 道玄坂エリア
('暴行', '2024-08-02', ST_GeomFromText('POINT(139.695 35.659)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '002'), '飲み屋街でのケンカ'),
('窃盗', '2024-08-06', ST_GeomFromText('POINT(139.697 35.661)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '002'), 'カラオケ店での財布盗難'),
('器物損壊', '2024-08-12', ST_GeomFromText('POINT(139.699 35.663)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '002'), '看板の破損'),

-- 宇田川町エリア
('窃盗', '2024-08-04', ST_GeomFromText('POINT(139.701 35.664)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '003'), '商業施設での万引き'),
('詐欺', '2024-08-09', ST_GeomFromText('POINT(139.703 35.666)', 4326), (SELECT id FROM areas WHERE ward_code = '13113' AND town_code = '003'), 'ネットカフェでの詐欺被害')
ON CONFLICT DO NOTHING;

-- 港区犯罪データ（高級住宅地特性）
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
-- 六本木エリア（夜間繁華街）
('暴行', '2024-08-01', ST_GeomFromText('POINT(139.732 35.664)', 4326), (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = '001'), 'クラブ前でのトラブル'),
('窃盗', '2024-08-05', ST_GeomFromText('POINT(139.736 35.668)', 4326), (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = '001'), '高級車からの盗難'),
('詐欺', '2024-08-08', ST_GeomFromText('POINT(139.734 35.666)', 4326), (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = '001'), 'ぼったくりバー被害'),
('窃盗', '2024-08-12', ST_GeomFromText('POINT(139.738 35.670)', 4326), (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = '001'), 'レストランでのバッグ盗難'),

-- 青山エリア（オフィス街）
('窃盗', '2024-08-03', ST_GeomFromText('POINT(139.717 35.672)', 4326), (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = '002'), 'オフィスビルでの置き引き'),
('器物損壊', '2024-08-07', ST_GeomFromText('POINT(139.721 35.676)', 4326), (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = '002'), '駐車場での車両損傷'),
('詐欺', '2024-08-11', ST_GeomFromText('POINT(139.719 35.674)', 4326), (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = '002'), '投資詐欺被害'),

-- 赤坂エリア（政治・ビジネス中心）
('窃盗', '2024-08-06', ST_GeomFromText('POINT(139.737 35.677)', 4326), (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = '003'), 'ホテルロビーでのスリ'),
('詐欺', '2024-08-10', ST_GeomFromText('POINT(139.741 35.681)', 4326), (SELECT id FROM areas WHERE ward_code = '13103' AND town_code = '003'), '名刺交換詐欺')
ON CONFLICT DO NOTHING;

-- データ投入結果確認
SELECT 
    '渋谷区' as ward,
    COUNT(DISTINCT a.id) as areas,
    COUNT(DISTINCT s.id) as schools,
    COUNT(DISTINCT c.id) as crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code = '13113'

UNION ALL

SELECT 
    '港区' as ward,
    COUNT(DISTINCT a.id) as areas,
    COUNT(DISTINCT s.id) as schools,
    COUNT(DISTINCT c.id) as crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code = '13103'

UNION ALL

SELECT 
    '全体' as ward,
    COUNT(DISTINCT a.id) as areas,
    COUNT(DISTINCT s.id) as schools,
    COUNT(DISTINCT c.id) as crimes
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id;

-- 安全性スコア再計算用クエリ
SELECT 
    s.name as school_name,
    s.type as school_type,
    a.name as area_name,
    COUNT(c.id) as crimes_within_500m,
    GREATEST(0, 100 - (COUNT(c.id) * 5)) as safety_score
FROM schools s
JOIN areas a ON s.area_id = a.id
LEFT JOIN crimes c ON ST_DWithin(
    c.location::geography,
    s.location::geography,
    500  -- 500m radius
)
WHERE c.date >= '2024-06-01'  -- 最近3ヶ月
GROUP BY s.id, s.name, s.type, a.name
ORDER BY safety_score ASC;