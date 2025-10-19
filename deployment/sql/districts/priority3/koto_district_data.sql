-- 江東区データ追加（Phase 3: Priority 3区データ拡張 - 第二弾）
-- 豊洲、お台場、亀戸、門前仲町、木場、東陽町エリアの学校・犯罪データ
-- 江東区コード: 13108

-- 江東区エリア追加
INSERT INTO areas (ward_code, town_code, name, geom) VALUES 
('13108', '001', '豊洲', ST_GeomFromText('POLYGON((139.790 35.653, 139.805 35.653, 139.805 35.665, 139.790 35.665, 139.790 35.653))', 4326)),
('13108', '002', 'お台場', ST_GeomFromText('POLYGON((139.770 35.625, 139.785 35.625, 139.785 35.635, 139.770 35.635, 139.770 35.625))', 4326)),
('13108', '003', '亀戸', ST_GeomFromText('POLYGON((139.820 35.695, 139.835 35.695, 139.835 35.710, 139.820 35.710, 139.820 35.695))', 4326)),
('13108', '004', '門前仲町', ST_GeomFromText('POLYGON((139.790 35.670, 139.805 35.670, 139.805 35.680, 139.790 35.680, 139.790 35.670))', 4326)),
('13108', '005', '木場', ST_GeomFromText('POLYGON((139.805 35.665, 139.820 35.665, 139.820 35.680, 139.805 35.680, 139.805 35.665))', 4326)),
('13108', '006', '東陽町', ST_GeomFromText('POLYGON((139.815 35.670, 139.830 35.670, 139.830 35.685, 139.815 35.685, 139.815 35.670))', 4326))
ON CONFLICT DO NOTHING;

-- 江東区学校データ（湾岸開発地域 + 伝統的下町）
INSERT INTO schools (name, type, public_private, location, area_id, address) 
SELECT 
    name, type::school_type, public_private::school_ownership, location, 
    (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = area_town_code),
    address
FROM (VALUES
    -- 豊洲エリア（最先端の湾岸開発地域）
    ('江東区立豊洲小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.795 35.658)', 4326), '001', '東京都江東区豊洲4-4-4'),
    ('江東区立豊洲西小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.798 35.661)', 4326), '001', '東京都江東区豊洲4-2-5'),
    ('江東区立豊洲北小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.800 35.663)', 4326), '001', '東京都江東区豊洲5-1-35'),
    ('豊洲中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.793 35.656)', 4326), '001', '東京都江東区豊洲2-2-18'),
    ('芝浦工業大学附属中学高等学校', 'high', 'private', ST_GeomFromText('POINT(139.796 35.659)', 4326), '001', '東京都江東区豊洲6-2-7'),
    
    -- お台場エリア（観光・エンターテインメント地区）
    ('江東区立有明小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.775 35.629)', 4326), '002', '東京都江東区有明2-10-1'),
    ('江東区立有明西学園', 'elementary', 'public', ST_GeomFromText('POINT(139.778 35.631)', 4326), '002', '東京都江東区有明2-1-8'),
    ('有明中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.780 35.632)', 4326), '002', '東京都江東区有明1-5-3'),
    
    -- 亀戸エリア（伝統的商業・住宅地）
    ('江東区立第一亀戸小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.825 35.699)', 4326), '003', '東京都江東区亀戸6-36-28'),
    ('江東区立第二亀戸小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.828 35.702)', 4326), '003', '東京都江東区亀戸7-39-30'),
    ('江東区立亀戸中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.830 35.705)', 4326), '003', '東京都江東区亀戸9-40-1'),
    ('関東第一高等学校', 'high', 'private', ST_GeomFromText('POINT(139.823 35.697)', 4326), '003', '東京都江東区亀戸7-65-12'),
    
    -- 門前仲町エリア（下町文化・神社仏閣）
    ('江東区立数矢小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.795 35.674)', 4326), '004', '東京都江東区門前仲町2-1-10'),
    ('江東区立深川第一中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.798 35.676)', 4326), '004', '東京都江東区門前仲町1-1-6'),
    ('中村中学高等学校', 'high', 'private', ST_GeomFromText('POINT(139.793 35.672)', 4326), '004', '東京都江東区清澄2-3-15'),
    
    -- 木場エリア（公園・住宅地）
    ('江東区立木場小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.810 35.669)', 4326), '005', '東京都江東区木場2-17-32'),
    ('江東区立東陽小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.813 35.672)', 4326), '005', '東京都江東区東陽2-1-20'),
    ('江東区立深川第四中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.815 35.675)', 4326), '005', '東京都江東区木場5-8-1'),
    
    -- 東陽町エリア（オフィス・住宅混在）
    ('江東区立東陽小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.820 35.674)', 4326), '006', '東京都江東区東陽3-27-12'),
    ('江東区立南陽小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.823 35.677)', 4326), '006', '東京都江東区東陽5-12-15'),
    ('江東区立深川第三中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.825 35.680)', 4326), '006', '東京都江東区東陽4-6-10'),
    ('東京都立科学技術高等学校', 'high', 'public', ST_GeomFromText('POINT(139.818 35.672)', 4326), '006', '東京都江東区東陽3-12-1')
) AS schools_data(name, type, public_private, location, area_town_code, address)
ON CONFLICT DO NOTHING;

-- 江東区犯罪データ（湾岸開発 + 伝統的下町の複合特性）
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
-- 豊洲エリア（高級住宅・商業施設）
('窃盗', '2024-08-01', ST_GeomFromText('POINT(139.796 35.659)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '001'), '豊洲市場周辺での車上荒らし'),
('詐欺', '2024-08-05', ST_GeomFromText('POINT(139.799 35.662)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '001'), '高級マンションでの架空投資詐欺'),
('器物損壊', '2024-08-08', ST_GeomFromText('POINT(139.794 35.657)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '001'), 'ららぽーと豊洲駐車場での車両破損'),
('窃盗', '2024-08-12', ST_GeomFromText('POINT(139.801 35.664)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '001'), 'タワーマンション駐輪場での自転車盗難'),
('器物損壊', '2024-08-15', ST_GeomFromText('POINT(139.797 35.660)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '001'), '商業施設の自動ドア破損'),
('窃盗', '2024-08-18', ST_GeomFromText('POINT(139.792 35.655)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '001'), '築地銀だこ前での置き引き'),

-- お台場エリア（観光地・イベント施設）
('窃盗', '2024-08-02', ST_GeomFromText('POINT(139.776 35.630)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '002'), 'お台場海浜公園での観光客スリ'),
('詐欺', '2024-08-06', ST_GeomFromText('POINT(139.779 35.632)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '002'), 'ダイバーシティ東京でのニセモノ商品販売'),
('器物損壊', '2024-08-09', ST_GeomFromText('POINT(139.781 35.633)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '002'), 'フジテレビ前の公共物破損'),
('窃盗', '2024-08-14', ST_GeomFromText('POINT(139.774 35.628)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '002'), 'ビーチでの貴重品盗難'),
('器物損壊', '2024-08-19', ST_GeomFromText('POINT(139.782 35.634)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '002'), 'パレットタウン観覧車周辺での落書き'),

-- 亀戸エリア（伝統的商店街・住宅地）
('窃盗', '2024-08-03', ST_GeomFromText('POINT(139.826 35.700)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '003'), '亀戸天神周辺での賽銭泥棒'),
('器物損壊', '2024-08-07', ST_GeomFromText('POINT(139.829 35.703)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '003'), '商店街の看板破損'),
('詐欺', '2024-08-11', ST_GeomFromText('POINT(139.831 35.706)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '003'), '高齢者狙いの訪問販売詐欺'),
('窃盗', '2024-08-16', ST_GeomFromText('POINT(139.824 35.698)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '003'), 'JR亀戸駅構内での置き引き'),
('暴行', '2024-08-20', ST_GeomFromText('POINT(139.832 35.707)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '003'), '居酒屋でのトラブル'),
('窃盗', '2024-08-23', ST_GeomFromText('POINT(139.827 35.701)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '003'), 'サンストリート亀戸での万引き'),

-- 門前仲町エリア（下町文化・神社仏閣）
('窃盗', '2024-08-04', ST_GeomFromText('POINT(139.796 35.675)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '004'), '富岡八幡宮での賽銭箱荒らし'),
('器物損壊', '2024-08-10', ST_GeomFromText('POINT(139.799 35.677)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '004'), '深川不動尊前の自転車破損'),
('詐欺', '2024-08-13', ST_GeomFromText('POINT(139.794 35.673)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '004'), '門前仲町商店街での押し売り'),
('窃盗', '2024-08-17', ST_GeomFromText('POINT(139.800 35.678)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '004'), '地下鉄門前仲町駅での置き引き'),
('器物損壊', '2024-08-21', ST_GeomFromText('POINT(139.792 35.671)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '004'), '商店街の自動販売機破損'),

-- 木場エリア（公園・住宅地）
('窃盗', '2024-08-05', ST_GeomFromText('POINT(139.811 35.670)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '005'), '木場公園での自転車盗難'),
('器物損壊', '2024-08-11', ST_GeomFromText('POINT(139.814 35.673)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '005'), '公園遊具への落書き'),
('窃盗', '2024-08-15', ST_GeomFromText('POINT(139.816 35.676)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '005'), '住宅街での空き巣'),
('詐欺', '2024-08-19', ST_GeomFromText('POINT(139.809 35.668)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '005'), 'リフォーム詐欺'),

-- 東陽町エリア（オフィス・住宅混在）
('窃盗', '2024-08-06', ST_GeomFromText('POINT(139.821 35.675)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '006'), '東陽町駅周辺での車上荒らし'),
('詐欺', '2024-08-12', ST_GeomFromText('POINT(139.824 35.678)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '006'), 'オフィスビルでの架空請求'),
('器物損壊', '2024-08-16', ST_GeomFromText('POINT(139.826 35.681)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '006'), 'コインパーキングでの車両破損'),
('窃盗', '2024-08-20', ST_GeomFromText('POINT(139.819 35.673)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '006'), 'マンション駐輪場での自転車盗難'),
('器物損壊', '2024-08-24', ST_GeomFromText('POINT(139.827 35.682)', 4326), (SELECT id FROM areas WHERE ward_code = '13108' AND town_code = '006'), '商業施設の看板破損')
ON CONFLICT DO NOTHING;

-- データ投入結果確認
DO $$
BEGIN
    RAISE NOTICE '=== 江東区データ追加結果（Phase 3-2） ===';
END
$$;

SELECT 
    '江東区' as ward_name,
    '13108' as ward_code,
    COUNT(DISTINCT a.id) as areas_count,
    COUNT(DISTINCT s.id) as schools_count,
    COUNT(DISTINCT c.id) as crimes_count
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code = '13108';

-- 全対応区数の確認
SELECT 
    COUNT(DISTINCT ward_code) as total_wards,
    array_agg(DISTINCT ward_code ORDER BY ward_code) as ward_codes
FROM areas;

COMMIT;
