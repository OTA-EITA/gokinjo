-- 近隣情報マッピングアプリ用データベース初期化スクリプト

-- PostGIS拡張を有効化
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Airflow用データベース
CREATE DATABASE airflow;

-- メインアプリケーション用スキーマ
\c neighborhood_mapping;

-- ENUMタイプの定義
CREATE TYPE school_type AS ENUM ('elementary', 'junior_high', 'high');
CREATE TYPE school_ownership AS ENUM ('public', 'private');

-- エリア（町丁目）テーブル
CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    ward_code TEXT NOT NULL,
    town_code TEXT NOT NULL,
    name TEXT NOT NULL,
    geom GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 学校テーブル
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type school_type NOT NULL,
    public_private school_ownership NOT NULL,
    location GEOMETRY(POINT, 4326),
    area_id INTEGER REFERENCES areas(id),
    address TEXT,
    safety_score INTEGER DEFAULT 50,
    score_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 犯罪テーブル（ハッシュベースUNIQUE制約対応）
CREATE TABLE IF NOT EXISTS crimes (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    location GEOMETRY(POINT, 4326),
    location_hash TEXT,  -- GEOMETRY型UNIQUE制約回避用
    area_id INTEGER REFERENCES areas(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_areas_geom ON areas USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_areas_ward_code ON areas(ward_code);
CREATE INDEX IF NOT EXISTS idx_areas_town_code ON areas(town_code);

CREATE INDEX IF NOT EXISTS idx_schools_location ON schools USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_schools_area_id ON schools(area_id);
CREATE INDEX IF NOT EXISTS idx_schools_type ON schools(type);
CREATE INDEX IF NOT EXISTS idx_schools_safety_score ON schools(safety_score);

CREATE INDEX IF NOT EXISTS idx_crimes_location ON crimes USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_crimes_area_id ON crimes(area_id);
CREATE INDEX IF NOT EXISTS idx_crimes_date ON crimes(date);
CREATE INDEX IF NOT EXISTS idx_crimes_category ON crimes(category);
CREATE INDEX IF NOT EXISTS idx_crimes_location_hash ON crimes(location_hash) WHERE location_hash IS NOT NULL;

-- 更新日時自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- location_hash自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_location_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location IS NOT NULL THEN
        NEW.location_hash = MD5(ST_AsText(NEW.location));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- UNIQUE制約追加（GEOMETRY対応）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_crime_occurrence' 
        AND table_name = 'crimes'
    ) THEN
        ALTER TABLE crimes 
        ADD CONSTRAINT unique_crime_occurrence 
        UNIQUE (category, date, location_hash);
    END IF;
END $$;

-- 各テーブルに更新日時トリガーを設定
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crimes_updated_at BEFORE UPDATE ON crimes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- location_hashトリガーを設定
DROP TRIGGER IF EXISTS trigger_update_location_hash ON crimes;
CREATE TRIGGER trigger_update_location_hash
    BEFORE INSERT OR UPDATE ON crimes
    FOR EACH ROW
    EXECUTE FUNCTION update_location_hash();

-- サンプルデータ挿入（テスト用）
INSERT INTO areas (ward_code, town_code, name, geom) VALUES 
('13101', '001', '千代田区丸の内', ST_GeomFromText('POLYGON((139.76 35.68, 139.77 35.68, 139.77 35.69, 139.76 35.69, 139.76 35.68))', 4326)),
('13102', '001', '中央区銀座', ST_GeomFromText('POLYGON((139.76 35.67, 139.77 35.67, 139.77 35.68, 139.76 35.68, 139.76 35.67))', 4326))
ON CONFLICT DO NOTHING;

INSERT INTO schools (name, type, public_private, location, area_id, address) VALUES 
('東京小学校', 'elementary', 'public', ST_GeomFromText('POINT(139.765 35.685)', 4326), 1, '東京都千代田区丸の内1-1-1'),
('銀座中学校', 'junior_high', 'public', ST_GeomFromText('POINT(139.765 35.675)', 4326), 2, '東京都中央区銀座1-1-1')
ON CONFLICT DO NOTHING;

INSERT INTO crimes (category, date, location, area_id, description) VALUES 
('窃盗', '2024-01-15', ST_GeomFromText('POINT(139.766 35.686)', 4326), 1, 'バッグのひったくり'),
('暴行', '2024-01-20', ST_GeomFromText('POINT(139.766 35.676)', 4326), 2, '路上での暴行事件')
ON CONFLICT DO NOTHING;

-- 権限設定
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- 列コメント追加
COMMENT ON COLUMN schools.safety_score IS '安全スコア (0-100, 高いほど安全)';
COMMENT ON COLUMN schools.score_updated_at IS '安全スコア最終更新日時';
