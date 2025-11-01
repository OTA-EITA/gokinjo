# Phase 3.5: パフォーマンス最適化実装計画

## 目標と期待効果

### パフォーマンス目標
- 初回レンダリング時間: 30%削減
- 地図操作レスポンス: 50%改善
- バンドルサイズ: 20%削減
- Lighthouse スコア: 90+達成

### 実装スケジュール
- Week 1-2: フロントエンド最適化
- Week 3-4: データ拡張対応準備（23区・200+校対応）

---

## Week 1: React最適化（Day 1-5）

### Day 1-2: React.memo + useMemo/useCallback

#### 最優先コンポーネント

1. **マーカーコンポーネント**（最も頻繁に再レンダリング）
   - SchoolMarker: 学校マーカー
   - CrimeMarker: 犯罪マーカー
   - 効果: 100+マーカーの不要な再レンダリング削減

2. **リストアイテムコンポーネント**
   - AreaItem: エリアリスト項目
   - SchoolListItem: 学校リスト項目
   - 効果: スクロール時のパフォーマンス向上

3. **統計パネル**
   - StatisticsPanel: 統計ダッシュボード
   - ChartComponent: グラフ表示
   - 効果: データ更新時の不要な再計算削減

#### 実装ファイル構成
```
frontend/src/components/
  ├── optimized/
  │   ├── MemoizedSchoolMarker.tsx
  │   ├── MemoizedCrimeMarker.tsx
  │   ├── MemoizedAreaCard.tsx
  │   └── MemoizedStatisticsPanel.tsx
  └── hooks/
      ├── useMemoizedData.ts
      └── useOptimizedCallbacks.ts
```

#### コミット計画
1. `feat: Add MemoizedSchoolMarker component`
2. `feat: Add MemoizedCrimeMarker component`
3. `feat: Add MemoizedAreaCard component`
4. `feat: Add MemoizedStatisticsPanel component`
5. `feat: Create useMemoizedData hook`
6. `feat: Create useOptimizedCallbacks hook`

### Day 3: Code Splitting

#### 実装項目
1. **ルートベース分割**
   ```typescript
   const MapView = lazy(() => import('./components/MapView'));
   const StatisticsView = lazy(() => import('./components/StatisticsView'));
   ```

2. **機能ベース分割**
   ```typescript
   const CrimeHeatmap = lazy(() => import('./features/CrimeHeatmap'));
   const RouteSearch = lazy(() => import('./features/RouteSearch'));
   ```

3. **ライブラリ分割**
   - Chart.js: 統計画面でのみロード
   - Leaflet plugins: 必要時にロード

#### コミット計画
1. `feat: Add route-based code splitting`
2. `feat: Add feature-based code splitting`
3. `feat: Add lazy loading for Chart.js`

### Day 4: Vite Build最適化

#### vite.config.ts最適化
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'chart-vendor': ['chart.js', 'react-chartjs-2']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

#### コミット計画
1. `perf: Optimize Vite build configuration`
2. `perf: Add manual chunk splitting`

### Day 5: 画像・アセット最適化

#### 実装項目
1. **画像最適化**
   - WebP形式への変換
   - 遅延ロード実装
   - レスポンシブ画像

2. **SVGアイコン最適化**
   - インラインSVG化
   - SVGO最適化

#### コミット計画
1. `perf: Add WebP image optimization`
2. `perf: Implement lazy image loading`

---

## Week 2: データ・API最適化（Day 6-10）

### Day 6-7: APIレスポンスキャッシュ

#### 実装項目
1. **React Query導入**
   ```bash
   npm install @tanstack/react-query
   ```

2. **キャッシュ戦略**
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5分
         cacheTime: 10 * 60 * 1000, // 10分
       },
     },
   });
   ```

3. **リクエストバッチング**
   - 複数のschool/crime取得を1リクエストに統合
   - エリア情報の事前フェッチ

#### コミット計画
1. `feat: Add React Query for data caching`
2. `feat: Implement request batching`
3. `perf: Add prefetching for area data`

### Day 8-9: Leaflet地図最適化

#### 実装項目
1. **マーカークラスタリング**
   ```bash
   npm install react-leaflet-markercluster
   ```

2. **ビューポート外マーカーの非表示**
   ```typescript
   const visibleMarkers = useMemo(() => 
     markers.filter(marker => 
       map.getBounds().contains(marker.position)
     ), [markers, mapBounds]
   );
   ```

3. **デバウンス処理**
   ```typescript
   const debouncedHandleMapMove = useMemo(
     () => debounce(handleMapMove, 300),
     []
   );
   ```

#### コミット計画
1. `feat: Add marker clustering`
2. `perf: Implement viewport filtering`
3. `perf: Add debounce for map interactions`

### Day 10: 仮想スクロール（React Window）

#### 実装項目
1. **React Window導入**
   ```bash
   npm install react-window
   ```

2. **長いリストの最適化**
   ```typescript
   import { FixedSizeList } from 'react-window';
   
   <FixedSizeList
     height={400}
     itemCount={schools.length}
     itemSize={80}
   >
     {SchoolRow}
   </FixedSizeList>
   ```

#### コミット計画
1. `feat: Add React Window for list virtualization`
2. `perf: Implement virtual scrolling for school list`

---

## パフォーマンス計測

### 計測ツール
1. **Lighthouse CI**
   ```bash
   npm install -g @lhci/cli
   ```

2. **React DevTools Profiler**
   - レンダリング時間計測
   - 不要な再レンダリング検出

3. **Chrome DevTools Performance**
   - バンドルサイズ分析
   - ネットワーク遅延測定

### ベンチマーク
```bash
# Before最適化
- 初回ロード: 3.5秒
- 地図操作: 300ms
- バンドルサイズ: 800KB

# After最適化（目標）
- 初回ロード: 2.5秒（30%削減）
- 地図操作: 150ms（50%改善）
- バンドルサイズ: 640KB（20%削減）
```

---

## 成功指標

### 定量指標
- Lighthouse Performance: 90+
- First Contentful Paint: < 1.5秒
- Time to Interactive: < 3秒
- Total Bundle Size: < 700KB

### 定性指標
- スムーズな地図操作
- 即座のフィルター反応
- ストレスフリーなスクロール

---

## 次のフェーズへの準備

### Phase 4準備（Week 3開始）
1. Dockerマルチステージビルド最適化
2. AWS EKS Terraform基盤構築開始
3. CI/CDパイプライン設計

最終更新: 2025-10-28
