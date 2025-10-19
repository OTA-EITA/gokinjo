-- 品川区データ追加（Phase 3: Priority 3区データ拡張 - 第三弾）
-- 大井町、五反田、天王洲、戸越、武蔵小山エリアの学校・犯罪データ
-- 品川区コード: 13109

-- 品川区エリア追加
INSERT INTO areas (ward_code, town_code, name, geom) VALUES 
('13109', '001', '大井町', ST_GeomFromText('POLYGON((139.730 35.605, 139.745 35.605, 139.745 35.618, 139.730 35.618, 139.730 35.605))', 4326)),
('13109', '002', '五反田', ST_GeomFromText('POLYGON((139.720 35.620, 139.735 35.620, 139.735 35.630, 139.720 35.630, 139.720 35.620))', 4326)),
('13109', '003', '天王洲', ST_GeomFromText('POLYGON((139.740 35.620, 139.755 35.620, 139.755 35.633, 139.740 35.633, 139.740 35.620))', 4326)),
('13109', '004', '戸越', ST_GeomFromText('POLYGON((139.710 35.610, 139.725 35.610, 139.725 35.620, 139.710 35.620, 139.710 35.610))', 4326)),
('13109', '005', '武蔵小山', ST_GeomFromText('POLYGON((139.705 35.610, 139.720 35.610, 139.720 35.623, 139.705 35.623, 139.705 35.610))', 4326))
ON CONFLICT DO NOTHING;

-- 品川区学校データ（ビジネス地区 + 住宅地）
INSERT INTO schools (name, type, public_private, location, area_id, address) 
SELECT 
    name, type::school_type, public_private::school_ownership, location, 
    (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = area_town_code),
    address
FROM (VALUES
    -- 大井町エリア（商業・ビジネス地区）
    ('品川区立山中小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.735 35.610)', 4326), '001', '東京都品川区大井4-11-34'),
    ('品川区立鈴ヶ森小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.738 35.613)', 4326), '001', '東京都品川区南大井6-17-18'),
    ('品川区立浜川中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.740 35.615)', 4326), '001', '東京都品川区南大井4-16-2'),
    ('品川女子学院中等部高等部', 'high', 'private', ST_GeomFromText('POINT(139.733 35.608)', 4326), '001', '東京都品川区北品川3-3-12'),
    
    -- 五反田エリア（オフィス・商業混在地区）
    ('品川区立第一日野小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.725 35.624)', 4326), '002', '東京都品川区西五反田6-5-32'),
    ('品川区立三木小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.728 35.627)', 4326), '002', '東京都品川区西五反田3-6-36'),
    ('品川区立荏原第五中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.730 35.629)', 4326), '002', '東京都品川区西五反田7-25-15'),
    ('朋優学院高等学校', 'high', 'private', ST_GeomFromText('POINT(139.723 35.622)', 4326), '002', '東京都品川区西五反田5-26-7'),
    
    -- 天王洲エリア（再開発ビジネス地区）
    ('品川区立台場小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.745 35.625)', 4326), '003', '東京都品川区東品川1-8-30'),
    ('品川区立東海中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.748 35.628)', 4326), '003', '東京都品川区東品川3-30-7'),
    ('品川エトワール女子高等学校', 'high', 'private', ST_GeomFromText('POINT(139.750 35.630)', 4326), '003', '東京都品川区南品川5-12-4'),
    
    -- 戸越エリア（下町住宅地・商店街）
    ('品川区立戸越小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.715 35.614)', 4326), '004', '東京都品川区戸越2-8-2'),
    ('品川区立源氏前小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.718 35.617)', 4326), '004', '東京都品川区戸越6-17-3'),
    ('品川区立荏原第一中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.720 35.619)', 4326), '004', '東京都品川区平塚3-16-26'),
    ('小野学園女子中学高等学校', 'high', 'private', ST_GeomFromText('POINT(139.713 35.612)', 4326), '004', '東京都品川区西大井1-6-13'),
    
    -- 武蔵小山エリア（商店街・住宅地）
    ('品川区立小山小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.710 35.615)', 4326), '005', '東京都品川区小山5-10-6'),
    ('品川区立第二延山小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.713 35.618)', 4326), '005', '東京都品川区旗の台5-11-15'),
    ('品川区立荏原第六中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.715 35.620)', 4326), '005', '東京都品川区小山台2-3-28'),
    ('文教大学付属中学高等学校', 'high', 'private', ST_GeomFromText('POINT(139.708 35.613)', 4326), '005', '東京都品川区旗の台3-2-17')
) AS schools_data(name, type, public_private, location, area_town_code, address)
ON CONFLICT DO NOTHING;

-- 品川区犯罪データ（ビジネス地区 + 住宅地の複合特性）
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
-- 大井町エリア（商業・ビジネス地区）
('窃盗', '2024-08-01', ST_GeomFromText('POINT(139.736 35.611)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '001'), 'JR大井町駅構内での置き引き'),
('詐欺', '2024-08-05', ST_GeomFromText('POINT(139.739 35.614)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '001'), '駅前商業施設での架空請求'),
('器物損壊', '2024-08-08', ST_GeomFromText('POINT(139.741 35.616)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '001'), 'アトレ大井町の車両破損'),
('窃盗', '2024-08-12', ST_GeomFromText('POINT(139.734 35.609)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '001'), 'コインパーキングでの車上荒らし'),
('暴行', '2024-08-15', ST_GeomFromText('POINT(139.742 35.617)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '001'), '居酒屋でのトラブル'),
('詐欺', '2024-08-18', ST_GeomFromText('POINT(139.737 35.612)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '001'), 'キャッチセールス詐欺'),

-- 五反田エリア（オフィス・商業混在）
('窃盗', '2024-08-02', ST_GeomFromText('POINT(139.726 35.625)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '002'), 'JR五反田駅での置き引き'),
('詐欺', '2024-08-06', ST_GeomFromText('POINT(139.729 35.628)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '002'), 'オフィスビルでの架空投資詐欺'),
('器物損壊', '2024-08-09', ST_GeomFromText('POINT(139.731 35.630)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '002'), '駐車場での車両破損'),
('窃盗', '2024-08-14', ST_GeomFromText('POINT(139.724 35.623)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '002'), 'レミィ五反田での万引き'),
('暴行', '2024-08-19', ST_GeomFromText('POINT(139.732 35.631)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '002'), '深夜の飲み屋街でのトラブル'),
('詐欺', '2024-08-22', ST_GeomFromText('POINT(139.727 35.626)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '002'), 'ぼったくりバー'),

-- 天王洲エリア（再開発ビジネス地区）
('窃盗', '2024-08-03', ST_GeomFromText('POINT(139.746 35.626)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '003'), '天王洲アイル駅周辺での自転車盗難'),
('詐欺', '2024-08-07', ST_GeomFromText('POINT(139.749 35.629)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '003'), 'オフィス向け架空請求'),
('器物損壊', '2024-08-11', ST_GeomFromText('POINT(139.751 35.631)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '003'), '商業施設の自動ドア破損'),
('窃盗', '2024-08-16', ST_GeomFromText('POINT(139.744 35.624)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '003'), 'タワーマンション駐輪場での盗難'),
('器物損壊', '2024-08-20', ST_GeomFromText('POINT(139.752 35.632)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '003'), 'ボードウォークでの公共物破損'),

-- 戸越エリア（下町住宅地・商店街）
('窃盗', '2024-08-04', ST_GeomFromText('POINT(139.716 35.615)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '004'), '戸越銀座商店街での万引き'),
('器物損壊', '2024-08-10', ST_GeomFromText('POINT(139.719 35.618)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '004'), '商店街の看板破損'),
('詐欺', '2024-08-13', ST_GeomFromText('POINT(139.721 35.620)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '004'), '高齢者狙いの訪問販売詐欺'),
('窃盗', '2024-08-17', ST_GeomFromText('POINT(139.714 35.613)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '004'), '住宅街での空き巣'),
('器物損壊', '2024-08-21', ST_GeomFromText('POINT(139.722 35.621)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '004'), '自転車の破損'),

-- 武蔵小山エリア（商店街・住宅地）
('窃盗', '2024-08-05', ST_GeomFromText('POINT(139.711 35.616)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '005'), '武蔵小山商店街での万引き'),
('器物損壊', '2024-08-11', ST_GeomFromText('POINT(139.714 35.619)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '005'), '商店街アーケードへの落書き'),
('詐欺', '2024-08-15', ST_GeomFromText('POINT(139.716 35.621)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '005'), 'リフォーム詐欺'),
('窃盗', '2024-08-19', ST_GeomFromText('POINT(139.709 35.614)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '005'), '住宅街での自転車盗難'),
('器物損壊', '2024-08-23', ST_GeomFromText('POINT(139.717 35.622)', 4326), (SELECT id FROM areas WHERE ward_code = '13109' AND town_code = '005'), '公園遊具への破損')
ON CONFLICT DO NOTHING;

-- データ投入結果確認
DO $$
BEGIN
    RAISE NOTICE '=== 品川区データ追加結果（Phase 3-3） ===';
END
$$;

SELECT 
    '品川区' as ward_name,
    '13109' as ward_code,
    COUNT(DISTINCT a.id) as areas_count,
    COUNT(DISTINCT s.id) as schools_count,
    COUNT(DISTINCT c.id) as crimes_count
FROM areas a
LEFT JOIN schools s ON s.area_id = a.id
LEFT JOIN crimes c ON c.area_id = a.id
WHERE a.ward_code = '13109';

-- 全対応区数の確認
SELECT 
    COUNT(DISTINCT ward_code) as total_wards,
    array_agg(DISTINCT ward_code ORDER BY ward_code) as ward_codes
FROM areas;

COMMIT;
