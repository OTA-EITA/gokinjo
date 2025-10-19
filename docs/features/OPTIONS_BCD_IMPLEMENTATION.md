# 新機能実装ガイド（Options B, C, D完了）

## 実装完了機能サマリー

### ✅ Option B: 実データAPI統合（Airflow DAG）
**ファイル**: `airflow/dags/external_data_sync_dag.py`

警視庁と文部科学省の公式データソースから自動的にデータを取得・更新するシステム。

**主な機能**:
- 警視庁オープンデータからの犯罪統計スクレイピング
- 文科省e-Stat APIからの学校データ取得
- 週次自動実行スケジュール（毎週月曜 2:00 AM）
- PostgreSQLへの自動ロード
- 安全スコアの自動再計算

**使用方法**:
```bash
# Airflow起動
make airflow-start

# DAG確認
make airflow-list-dags

# 手動実行
cd airflow
docker-compose -f docker-compose.airflow.yml exec airflow-webserver \
  airflow dags trigger external_data_sync
```

---

### ✅ Option C: 安全ルート検索機能
**ファイル**: `frontend/src/components/SafeRouteSearch.tsx`

学校への通学路を犯罪データに基づいて最適化するインタラクティブなルート検索機能。

**主な機能**:
- 地図クリックで出発地・目的地を設定
- 学校選択ドロップダウン
- 3つのルート最適化モード:
  - 最も安全: 犯罪回避を最優先
  - バランス: 安全性と距離のバランス
  - 最短距離: 距離を最優先
- 犯罪密度ヒートマップ分析（100mグリッド）
- ルート安全スコア計算
- 色分けされたルート表示（緑/黄/橙/赤）

**使用方法**:
1. サイドバーの「🚶 Safe Route Search」ボタンをクリック
2. 地図上で出発地をクリック
3. 目的地をクリック（または学校選択）
4. ルート優先度を選択
5. 「ルート計算」ボタンをクリック

**技術詳細**:
- Haversine公式による距離計算
- 犯罪密度の空間分析
- Leaflet polylineでのルート可視化
- リアルタイム統計表示

---

### ✅ Option D: エクスポート機能強化
**ファイル**: `frontend/src/utils/enhancedExport.ts`

Excel・PDF形式での詳細レポート生成機能。

**Excel機能** (5シート構成):
1. **サマリー**: 主要統計と概要
2. **学校一覧**: 全学校の詳細情報（安全スコア含む）
3. **犯罪一覧**: 犯罪データの完全リスト
4. **安全スコア分析**: 安全スコア順ランキング
5. **エリア統計**: カテゴリ別統計データ

**Excel特徴**:
- オートフィルター有効化
- 列幅自動調整
- 日本語対応
- タイムスタンプ付きファイル名

**PDF機能**:
- プロフェッショナルなレイアウト
- サマリー統計
- 地図スクリーンショット統合（html2canvas）
- 高解像度画像エクスポート（2x scale）
- 複数ページ対応

**使用方法**:
```typescript
import { generateExcelReport, generateEnhancedPDF } from './utils/enhancedExport';

// Excel生成
generateExcelReport(schools, crimes, safetyScores, statistics, areaName);

// PDF生成（地図付き）
const mapElement = document.getElementById('map');
await generateEnhancedPDF(statistics, areaName, mapElement);
```

**依存ライブラリ**:
```json
{
  "xlsx": "^0.18.5",
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1"
}
```

---

## セットアップ手順

### 1. 依存関係インストール

```bash
cd frontend
npm install
```

新規追加パッケージ:
- xlsx
- jspdf
- html2canvas

### 2. Airflow設定（Option B用）

```bash
# Airflow起動
make airflow-start

# e-Stat APIキー設定（必要に応じて）
# airflow/dags/external_data_sync_dag.py の api_key を環境変数化
```

### 3. フロントエンドビルド確認

```bash
cd frontend
npm run type-check
npm run build
```

---

## 使用例

### Safe Route Search

```typescript
// App.tsxに統合済み
const [showRouteSearch, setShowRouteSearch] = useState(false);

<button onClick={() => setShowRouteSearch(!showRouteSearch)}>
  Safe Route Search
</button>

{showRouteSearch && map && L && (
  <SafeRouteSearch
    schools={filteredSchools}
    crimes={filteredCrimes}
    map={map}
    L={L}
  />
)}
```

### Enhanced Export

```typescript
import { generateExcelReport } from './utils/enhancedExport';

const handleExportExcel = () => {
  if (statisticsData) {
    generateExcelReport(
      filteredSchools,
      filteredCrimes,
      filteredSafetyScores,
      statisticsData,
      selectedArea?.name || '東京都'
    );
  }
};
```

---

## アーキテクチャ

### データフロー（Option B）

```
警視庁 Web → BeautifulSoup → pandas → PostgreSQL → API → Frontend
文科省 API → pandas → PostgreSQL → API → Frontend
```

### ルート計算アルゴリズム（Option C）

1. **犯罪ヒートマップ作成**: 100mグリッドで犯罪密度を計算
2. **ウェイポイント生成**: 開始・終了地点間に20個のポイント
3. **各ポイントの犯罪評価**: グリッドキーで犯罪件数を取得
4. **安全スコア計算**: `100 - (犯罪件数 / 最大想定) * 100`
5. **距離計算**: Haversine公式
6. **推定時間**: 徒歩速度4km/h

### エクスポート処理フロー（Option D）

```
データ収集 → フォーマット変換 → シート/ページ生成 → ファイル出力
```

---

## パフォーマンス考慮事項

### Option B（データ同期）
- **実行頻度**: 週1回（データ量削減）
- **エラーハンドリング**: リトライ2回、5分間隔
- **データ検証**: 重複チェック、座標検証

### Option C（ルート検索）
- **計算効率**: 簡易版アルゴリズム（直線ベース）
- **将来拡張**: Dijkstra法、A*アルゴリズム対応可能
- **メモリ使用**: 犯罪データのMap構造化

### Option D（エクスポート）
- **Excel**: ストリーミング書き込み（大量データ対応）
- **PDF**: canvas解像度2x（品質vs容量）
- **地図キャプチャ**: html2canvas非同期処理

---

## トラブルシューティング

### Option B: DAGが実行されない

**確認事項**:
```bash
# DAGリスト確認
make airflow-list-dags

# DAGの有効化
cd airflow
docker-compose -f docker-compose.airflow.yml exec airflow-webserver \
  airflow dags unpause external_data_sync

# ログ確認
make airflow-logs
```

### Option C: ルートが表示されない

**確認事項**:
- 出発地・目的地が正しく設定されているか
- 犯罪データが読み込まれているか（0件だと計算不可）
- ブラウザコンソールでエラー確認

**デバッグ**:
```javascript
// ブラウザコンソールで確認
console.log('Schools:', schools.length);
console.log('Crimes:', crimes.length);
console.log('Map instance:', map);
```

### Option D: Excelファイルが開けない

**原因**: ブラウザの自動ダウンロードブロック

**解決策**:
1. ブラウザ設定でダウンロード許可
2. ポップアップブロック解除
3. HTTPS環境で実行

---

## テスト方法

### Option B: データ同期テスト

```bash
# 手動トリガー
make airflow-run-dag DAG_ID=external_data_sync

# 実行結果確認
make db-shell
SELECT COUNT(*) FROM crimes WHERE date > CURRENT_DATE - INTERVAL '7 days';
```

### Option C: ルート検索テスト

1. フロントエンド起動: `cd frontend && npm run dev`
2. エリア選択（データ読み込み）
3. 「Safe Route Search」をクリック
4. 地図クリックで2点設定
5. 「ルート計算」をクリック
6. ルートが緑/黄/橙/赤で表示されることを確認

### Option D: エクスポートテスト

```bash
# フロントエンド起動
cd frontend && npm run dev

# 統計ダッシュボード表示
# エリア選択 → 「Show Statistics」

# Excelエクスポート
# 「Export CSV」ボタンをクリック

# PDFエクスポート
# 「Export PDF」ボタンをクリック
```

---

## 次のステップ（Option E, F）

### Option E: パフォーマンス最適化
- [ ] React.memo でコンポーネント最適化
- [ ] useMemo / useCallback でレンダリング削減
- [ ] 仮想スクロール（React Window）
- [ ] Code splitting（動的import）
- [ ] Service Worker（オフライン対応）

### Option F: AWS EKSデプロイ
- [ ] Dockerマルチステージビルド
- [ ] Kubernetesマニフェスト作成
- [ ] Terraform IaC
- [ ] CI/CD（GitHub Actions）
- [ ] 監視（Prometheus + Grafana）

---

## 変更ファイル一覧

```
airflow/dags/
└── external_data_sync_dag.py          (新規)

frontend/src/
├── components/
│   └── SafeRouteSearch.tsx            (新規)
├── utils/
│   └── enhancedExport.ts              (新規)
├── App.tsx                             (更新)
└── package.json                        (更新)
```

---

## コミット準備

```bash
# ステージング
git add airflow/dags/external_data_sync_dag.py
git add frontend/src/components/SafeRouteSearch.tsx
git add frontend/src/utils/enhancedExport.ts
git add frontend/src/App.tsx
git add frontend/package.json

# 統合コミット
git commit -m "feat: implement Options B, C, D (API sync, route search, enhanced export)

Add three major feature enhancements:

Option B - Real Data API Integration:
- Automated crime data sync from Keishicho
- School data sync from MEXT e-Stat API  
- Weekly schedule (Monday 2:00 AM)
- Airflow DAG: external_data_sync

Option C - Safe Route Search:
- Interactive route planning with crime avoidance
- 3 optimization modes (safest/balanced/fastest)
- Crime density heatmap analysis
- Visual safety-coded routes
- Walking time estimation

Option D - Enhanced Export:
- Multi-sheet Excel reports (5 sheets)
- PDF with map screenshots
- Professional formatting
- Auto-filter and auto-width

New Dependencies:
- xlsx@0.18.5
- jspdf@2.5.1
- html2canvas@1.4.1

Technical:
- TypeScript strict typing
- Haversine distance calculations
- Crime spatial analysis
- html2canvas async map capture
- Airflow automation pipeline

Impact:
- Automated weekly data updates
- Practical route planning for safety
- Professional report generation
- Enhanced data accessibility"
```

---

**実装完了日**: 2025-10-19  
**実装者**: Claude  
**次回**: Options E (パフォーマンス最適化) & F (AWS EKSデプロイ)
