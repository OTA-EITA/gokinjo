-- 追加の犯罪サンプルデータ
-- 既存データの確認
SELECT COUNT(*) FROM crimes;

-- より多くの犯罪データを追加（安全性スコアの計算をテストするため）

-- 千代田区丸の内エリア（area_id = 1）の犯罪データ
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
('窃盗', '2024-01-15', ST_GeomFromText('POINT(139.766 35.686)', 4326), 1, 'バッグのひったくり'),
('窃盗', '2024-01-20', ST_GeomFromText('POINT(139.764 35.684)', 4326), 1, '自転車の窃盗'),
('詐欺', '2024-01-25', ST_GeomFromText('POINT(139.767 35.687)', 4326), 1, '振り込め詐欺'),
('暴行', '2024-02-01', ST_GeomFromText('POINT(139.765 35.685)', 4326), 1, '路上での口論'),
('窃盗', '2024-02-05', ST_GeomFromText('POINT(139.763 35.683)', 4326), 1, 'コンビニでの万引き'),
('器物損壊', '2024-02-10', ST_GeomFromText('POINT(139.768 35.688)', 4326), 1, '駐車場での車両への傷'),
('窃盗', '2024-02-15', ST_GeomFromText('POINT(139.762 35.682)', 4326), 1, '置き引き'),
('詐欺', '2024-02-20', ST_GeomFromText('POINT(139.769 35.689)', 4326), 1, 'ネット詐欺')
ON CONFLICT DO NOTHING;

-- 中央区銀座エリア（area_id = 2）の犯罪データ  
INSERT INTO crimes (category, date, location, area_id, description) VALUES 
('暴行', '2024-01-20', ST_GeomFromText('POINT(139.766 35.676)', 4326), 2, '路上での暴行事件'),
('窃盗', '2024-01-22', ST_GeomFromText('POINT(139.764 35.674)', 4326), 2, 'ショッピングでのスリ'),
('窃盗', '2024-01-28', ST_GeomFromText('POINT(139.767 35.677)', 4326), 2, 'レストランでの財布盗難'),
('詐欺', '2024-02-02', ST_GeomFromText('POINT(139.763 35.673)', 4326), 2, '偽ブランド品販売'),
('器物損壊', '2024-02-08', ST_GeomFromText('POINT(139.768 35.678)', 4326), 2, '看板への落書き'),
('窃盗', '2024-02-12', ST_GeomFromText('POINT(139.762 35.672)', 4326), 2, '駐輪場での自転車窃盗'),
('暴行', '2024-02-18', ST_GeomFromText('POINT(139.765 35.675)', 4326), 2, '酔客同士のトラブル'),
('窃盗', '2024-02-22', ST_GeomFromText('POINT(139.769 35.679)', 4326), 2, '百貨店での万引き')
ON CONFLICT DO NOTHING;

-- 各学校周辺の犯罪密度を確認するクエリ
SELECT 
    s.name as school_name,
    s.type as school_type,
    COUNT(c.id) as nearby_crimes_500m
FROM schools s
LEFT JOIN crimes c ON ST_DWithin(
    c.location,
    s.location::geography,
    500  -- 500m radius
)
GROUP BY s.id, s.name, s.type
ORDER BY nearby_crimes_500m DESC;