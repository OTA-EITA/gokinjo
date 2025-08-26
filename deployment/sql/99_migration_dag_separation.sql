-- 分離DAG対応 - schoolsテーブル安全スコア列追加マイグレーション
-- 実行日: 2025-08-26
-- 目的: DAG分離による安全スコア機能に対応

-- 既存のschoolsテーブルに安全スコア関連列を追加
DO $$
BEGIN
    -- safety_score列が存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'safety_score'
    ) THEN
        ALTER TABLE schools ADD COLUMN safety_score INTEGER DEFAULT 50;
        RAISE NOTICE 'Added safety_score column to schools table';
    ELSE
        RAISE NOTICE 'safety_score column already exists';
    END IF;

    -- score_updated_at列が存在しない場合のみ追加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'schools' AND column_name = 'score_updated_at'
    ) THEN
        ALTER TABLE schools ADD COLUMN score_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added score_updated_at column to schools table';
    ELSE
        RAISE NOTICE 'score_updated_at column already exists';
    END IF;
END
$$;

-- インデックス作成（存在しない場合のみ）
CREATE INDEX IF NOT EXISTS idx_schools_safety_score ON schools(safety_score);

-- 列コメント追加
COMMENT ON COLUMN schools.safety_score IS '安全スコア (0-100, 高いほど安全)';
COMMENT ON COLUMN schools.score_updated_at IS '安全スコア最終更新日時';

-- 既存の学校データにデフォルト安全スコアを設定
UPDATE schools 
SET 
    safety_score = 50,
    score_updated_at = CURRENT_TIMESTAMP
WHERE safety_score IS NULL;

-- 確認用クエリ
SELECT 
    COUNT(*) as total_schools,
    AVG(safety_score) as avg_safety_score,
    MIN(safety_score) as min_score,
    MAX(safety_score) as max_score
FROM schools;

-- マイグレーション完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '=== 分離DAG対応マイグレーション完了 ===';
    RAISE NOTICE '- schools.safety_score列追加完了';
    RAISE NOTICE '- schools.score_updated_at列追加完了'; 
    RAISE NOTICE '- インデックス作成完了';
    RAISE NOTICE '- 既存データのデフォルト値設定完了';
    RAISE NOTICE '=======================================';
END
$$;
