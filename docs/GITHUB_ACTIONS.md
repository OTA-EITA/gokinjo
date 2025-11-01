# GitHub Actions - 自動品質チェック

このプロジェクトでは、**継続的な品質改善**のために複数の自動チェックワークフローを実装しています。

## ワークフロー概要

### 1. Quality Check (朝・夜の定期チェック)
**ファイル**: `.github/workflows/quality-check.yml`

#### 朝の品質チェック（午前9時 JST）
- **実行内容**:
  - Lighthouse CI によるフロントエンドパフォーマンス計測
  - Performance、Accessibility、SEO、Best Practices の4指標を測定
  - TypeScript型チェック・ESLint実行
  - ビルド構造検証（dist/dist/ネスト防止）
  - 結果を Issue として自動作成

- **成果物**:
  - 詳細なLighthouseレポート（Artifacts、30日保存）
  - 改善提案付きの Issue

#### 夜の品質チェック（午後9時 JST）
- **実行内容**:
  - Ruff によるPythonコード品質チェック
  - Bandit によるセキュリティ脆弱性スキャン
  - Safety による依存関係の脆弱性チェック
  - 結果を Issue として自動作成

- **成果物**:
  - コード品質レポート（Artifacts、30日保存）
  - セキュリティレポート（Artifacts、30日保存）
  - 改善タスク付きの Issue

### 2. Frontend Quality Check（PR・Push時）
**ファイル**: `.github/workflows/frontend-check.yml`

- **トリガー**:
  - フロントエンドファイル変更のPR
  - masterブランチへのpush（frontendディレクトリ）

- **実行内容**:
  1. TypeScript型チェック
  2. ESLint品質チェック
  3. 本番ビルド
  4. ビルド構造検証
  5. Lighthouse CI実行
  6. スコアパース・PR自動コメント

- **PR自動コメント内容**:
  ```
  🚦 Lighthouse CI Results
  
  | Category | Score | Status |
  |----------|-------|--------|
  | Performance | 85% | 🟢 |
  | Accessibility | 92% | 🟢 |
  | Best Practices | 88% | 🟢 |
  | SEO | 90% | 🟢 |
  ```

## 自動生成される Issue ラベル

- `lighthouse`: Lighthouse CI 関連
- `performance`: パフォーマンス改善
- `quality`: コード品質関連
- `security`: セキュリティ関連
- `automated`: 自動生成レポート
- `evening-check`: 夜の定期チェック

## ローカルでの実行

### Lighthouse CI
```bash
cd frontend
npm ci
npm run build
npm run lighthouse

# デバッグモード（詳細ログ）
npm run lighthouse:debug
```

### セキュリティスキャン
```bash
pip install ruff bandit safety
ruff check airflow/ scripts/
bandit -r airflow/ scripts/
pip freeze | safety check
```

## ビルド検証

フロントエンドビルド時に以下を自動検証：

```bash
# ❌ 検出するとエラー
dist/dist/        # ネストされたdistディレクトリ
                  # → public/ディレクトリに不要なファイルがある

# ✅ 必須ファイル
dist/index.html   # エントリーポイント
dist/assets/      # バンドルされたJS/CSS
```

詳細は `frontend/public/README.md` を参照。

## カスタマイズ

### 実行スケジュールの変更
`.github/workflows/quality-check.yml` の `cron` 設定を編集：

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # UTC時刻で指定（午前9時JST）
    - cron: '0 12 * * *' # UTC時刻で指定（午後9時JST）
```

### Lighthouse 閾値の調整
`frontend/lighthouserc.cjs` を編集：

```javascript
assertions: {
  'categories:performance': ['warn', { minScore: 0.7 }],
  'categories:accessibility': ['warn', { minScore: 0.8 }],
  // ...
}
```

### PR自動コメントの無効化
`.github/workflows/frontend-check.yml` の該当ステップをコメントアウト。

## トラブルシューティング

### Issue が作成されない
1. リポジトリの Settings > Actions > General で権限確認
2. Workflow の permissions 設定確認：
   ```yaml
   permissions:
     contents: write
     issues: write
   ```

### Lighthouse CI が失敗する
1. Node.js バージョン確認（20推奨）
2. ビルド成果物確認：
   ```bash
   ls -la frontend/dist/
   # index.htmlとassets/が存在するか
   ```
3. public/ディレクトリに不要なファイルがないか確認

### dist/dist/ ネストエラー
`public/`ディレクトリに以下のファイルが混入していないか確認：
- `public/dist/`
- `public/src/`
- `public/index.html`

これらは`.gitignore`で除外されています。

### セキュリティスキャンが失敗する
1. Python バージョン確認（3.11推奨）
2. 依存関係インストール確認：
   ```bash
   pip install ruff bandit safety
   ```

## 成果物の保存期間

- Lighthouse results: **30日**
- Quality reports: **30日**

長期保存が必要な場合は、`retention-days`を変更：
```yaml
- uses: actions/upload-artifact@v4
  with:
    retention-days: 90  # 90日に変更
```

## パフォーマンス目標

### 現在の閾値（警告レベル）
- Performance: 70%+
- Accessibility: 80%+
- Best Practices: 80%+
- SEO: 80%+

### 目標スコア（Phase 3.5最適化後）
- Performance: 90%+
- Accessibility: 95%+
- Best Practices: 90%+
- SEO: 95%+

詳細は `docs/optimization/phase3_5_performance_plan.md` を参照。

---

**最終更新**: 2025-11-02  
**メンテナー**: 近隣情報マッピングアプリ開発チーム
