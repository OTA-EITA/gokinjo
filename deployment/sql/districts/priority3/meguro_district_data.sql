-- 目黒区データ追加（Phase 3: Priority 3区データ拡張 - 第四弾）
-- 自由が丘、中目黒、学芸大学、祐天寺、都立大学エリアの学校・犯罪データ
-- 目黒区コード: 13110

-- 目黒区エリア追加
INSERT INTO areas (ward_code, town_code, name, geom) VALUES 
('13110', '001', '自由が丘', ST_GeomFromText('POLYGON((139.665 35.605, 139.680 35.605, 139.680 35.615, 139.665 35.615, 139.665 35.605))', 4326)),
('13110', '002', '中目黒', ST_GeomFromText('POLYGON((139.695 35.640, 139.710 35.640, 139.710 35.650, 139.695 35.650, 139.695 35.640))', 4326)),
('13110', '003', '学芸大学', ST_GeomFromText('POLYGON((139.685 35.620, 139.700 35.620, 139.700 35.630, 139.685 35.630, 139.685 35.620))', 4326)),
('13110', '004', '祐天寺', ST_GeomFromText('POLYGON((139.690 35.630, 139.705 35.630, 139.705 35.640, 139.690 35.640, 139.690 35.630))', 4326)),
('13110', '005', '都立大学', ST_GeomFromText('POLYGON((139.675 35.610, 139.690 35.610, 139.690 35.620, 139.675 35.620, 139.675 35.610))', 4326))
ON CONFLICT DO NOTHING;

-- 目黒区学校データ（高級住宅地 + 文教地区）
INSERT INTO schools (name, type, public_private, location, area_id, address) 
SELECT 
    name, type::school_type, public_private::school_ownership, location, 
    (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = area_town_code),
    address
FROM (VALUES
    -- 自由が丘エリア（高級住宅・商業地区）
    ('目黒区立緑ヶ丘小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.670 35.609)', 4326), '001', '東京都目黒区緑が丘2-13-1'),
    ('目黒区立東根小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.673 35.611)', 4326), '001', '東京都目黒区自由が丘1-5-1'),
    ('目黒区立第十一中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.675 35.613)', 4326), '001', '東京都目黒区自由が丘3-12-23'),
    ('自由が丘学園高等学校', 'high', 'private', ST_GeomFromText('POINT(139.668 35.607)', 4326), '001', '東京都目黒区自由が丘2-21-1'),
    
    -- 中目黒エリア（文化・商業地区）
    ('目黒区立中目黒小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.700 35.644)', 4326), '002', '東京都目黒区中目黒3-13-32'),
    ('目黒区立東山小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.703 35.647)', 4326), '002', '東京都目黒区東山1-24-31'),
    ('目黒区立第一中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.705 35.649)', 4326), '002', '東京都目黒区上目黒2-37-26'),
    ('トキワ松学園中学高等学校', 'high', 'private', ST_GeomFromText('POINT(139.698 35.642)', 4326), '002', '東京都目黒区碑文谷4-17-16'),
    
    -- 学芸大学エリア（文教・住宅地区）
    ('目黒区立鷹番小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.690 35.624)', 4326), '003', '東京都目黒区鷹番3-17-20'),
    ('目黒区立五本木小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.693 35.627)', 4326), '003', '東京都目黒区五本木1-12-1'),
    ('目黒区立第九中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.695 35.629)', 4326), '003', '東京都目黒区碑文谷5-10-21'),
    ('多摩大学目黒中学高等学校', 'high', 'private', ST_GeomFromText('POINT(139.688 35.622)', 4326), '003', '東京都目黒区下目黒4-10-24'),
    
    -- 祐天寺エリア（住宅地区）
    ('目黒区立五本木小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.695 35.634)', 4326), '004', '東京都目黒区祐天寺2-6-3'),
    ('目黒区立上目黒小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.698 35.637)', 4326), '004', '東京都目黒区上目黒5-22-37'),
    ('目黒区立第三中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.700 35.639)', 4326), '004', '東京都目黒区目黒1-1-1'),
    ('目黒学院中学高等学校', 'high', 'private', ST_GeomFromText('POINT(139.693 35.632)', 4326), '004', '東京都目黒区中目黒1-1-50'),
    
    -- 都立大学エリア（文教・住宅地区）
    ('目黒区立宮前小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.680 35.614)', 4326), '005', '東京都目黒区八雲3-10-3'),
    ('目黒区立八雲小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.683 35.617)', 4326), '005', '東京都目黒区八雲2-5-1'),
    ('目黒区立第十中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.685 35.619)', 4326), '005', '東京都目黒区八雲1-10-1'),
    ('都立大学附属高等学校', 'high', 'public', ST_GeomFromText('POINT(139.678 35.612)', 4326), '005', '東京都目黒区平町1-29-1')
) AS schools_data(name, type, public_private, location, area_town_code, address)
ON CONFLICT DO NOTHING;

-- 目黒区犯罪データ（高級住宅地の特性）
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
-- 自由が丘エリア（高級住宅・商業地）
('窃盗', '2024-08-01', ST_GeomFromText('POINT(139.671 35.610)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '001'), '自由が丘駅周辺での高級ブランド品万引き'),
('詐欺', '2024-08-05', ST_GeomFromText('POINT(139.674 35.612)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '001'), '高級住宅地での架空投資詐欺'),
('器物損壊', '2024-08-08', ST_GeomFromText('POINT(139.676 35.614)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '001'), '高級車への傷つけ'),
('窃盗', '2024-08-12', ST_GeomFromText('POINT(139.669 35.608)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '001'), 'カフェでの置き引き'),
('器物損壊', '2024-08-15', ST_GeomFromText('POINT(139.677 35.615)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '001'), '商店街の看板破損'),

-- 中目黒エリア（文化・商業地区）
('窃盗', '2024-08-02', ST_GeomFromText('POINT(139.701 35.645)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '002'), '中目黒駅構内での置き引き'),
('詐欺', '2024-08-06', ST_GeomFromText('POINT(139.704 35.648)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '002'), 'ギャラリーでの偽物販売'),
('器物損壊', '2024-08-09', ST_GeomFromText('POINT(139.706 35.650)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '002'), '目黒川沿いの自転車破損'),
('窃盗', '2024-08-14', ST_GeomFromText('POINT(139.699 35.643)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '002'), 'セレクトショップでの万引き'),
('暴行', '2024-08-18', ST_GeomFromText('POINT(139.707 35.651)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '002'), 'バーでのトラブル'),

-- 学芸大学エリア（文教・住宅地）
('窃盗', '2024-08-03', ST_GeomFromText('POINT(139.691 35.625)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '003'), '学芸大学駅周辺での自転車盗難'),
('器物損壊', '2024-08-07', ST_GeomFromText('POINT(139.694 35.628)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '003'), '商店街の自動販売機破損'),
('詐欺', '2024-08-11', ST_GeomFromText('POINT(139.696 35.630)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '003'), '学生狙いのマルチ商法'),
('窃盗', '2024-08-16', ST_GeomFromText('POINT(139.689 35.623)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '003'), '書店での万引き'),
('器物損壊', '2024-08-20', ST_GeomFromText('POINT(139.697 35.631)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '003'), '公園遊具への落書き'),

-- 祐天寺エリア（住宅地）
('窃盗', '2024-08-04', ST_GeomFromText('POINT(139.696 35.635)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '004'), '祐天寺駅での置き引き'),
('器物損壊', '2024-08-10', ST_GeomFromText('POINT(139.699 35.638)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '004'), '住宅街での車両破損'),
('詐欺', '2024-08-13', ST_GeomFromText('POINT(139.701 35.640)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '004'), '高齢者狙いの訪問販売詐欺'),
('窃盗', '2024-08-17', ST_GeomFromText('POINT(139.694 35.633)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '004'), '住宅街での空き巣'),
('器物損壊', '2024-08-21', ST_GeomFromText('POINT(139.702 35.641)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '004'), '駐輪場での自転車破損'),

-- 都立大学エリア（文教・住宅地）
('窃盗', '2024-08-05', ST_GeomFromText('POINT(139.681 35.615)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '005'), '都立大学駅周辺での自転車盗難'),
('器物損壊', '2024-08-11', ST_GeomFromText('POINT(139.684 35.618)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '005'), '商店街の看板破損'),
('詐欺', '2024-08-15', ST_GeomFromText('POINT(139.686 35.620)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '005'), 'リフォーム詐欺'),
('窃盗', '2024-08-19', ST_GeomFromText('POINT(139.679 35.613)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '005'), '図書館での盗難'),
('器物損壊', '2024-08-23', ST_GeomFromText('POINT(139.687 35.621)', 4326), (SELECT id FROM areas WHERE ward_code = '13110' AND town_code = '005'), '公園の設備破損')
ON CONFLICT DO NOTHING;

-- データ投入結果確認
DO $$
BEGIN
    RAISE NOTICE '=== 目黒区データ追加結果（Phase 3-4） ===';
END
$$;

SELECT 
    '目黒区' as ward_name,
    '13110' as ward_code,
    COUNT(DISTINCT a.id) as areas_count,
    COUNT(DISTINCT s.id) as schools_count,
    COUNT(DISTINCT c.id) as crimes_count
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code = '13110';

-- 全対応区数の確認
SELECT 
    COUNT(DISTINCT ward_code) as total_wards,
    array_agg(DISTINCT ward_code ORDER BY ward_code) as ward_codes
FROM areas;

COMMIT;
