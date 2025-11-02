# フロントエンド - TypeScript版（シンプル構成）

近隣情報マッピングアプリのReact + TypeScript フロントエンドです。

## 🔧 技術スタック

- **React 18**: CDN経由で読み込み
- **TypeScript 5.2**: 型安全な開発
- **Leaflet 1.9**: インタラクティブ地図表示
- **Vanilla CSS**: モダンなスタイリング

## 📁 シンプルファイル構成

```
frontend/
├── package.json              # プロジェクト設定
├── tsconfig.json             # TypeScript設定
├── README.md                 # このファイル
├── src/
│   └── app.ts               # すべてを含む単一TypeScriptファイル
└── public/
    ├── index.html           # エントリーポイント
    └── dist/                # コンパイル済みJS
        └── app.js           # tscでコンパイルされたファイル
```

## 🚀 使用方法

### 1. 開発セットアップ
```bash
cd frontend

# TypeScriptコンパイル
npm run build

# サーバー起動
npm run dev
# または
../start_frontend.sh
```

### 2. 開発ワークフロー
```bash
# 自動コンパイル（別ターミナル）
npm run build:watch

# サーバー起動（別ターミナル）
npm run dev
```

### 3. 型チェック
```bash
npm run type-check
```

### 4. Lighthouse CI（パフォーマンス計測）
```bash
# デスクトップ版（推奨）
npm run lighthouse:desktop

# モバイル版
npm run lighthouse:mobile

# デフォルト（デスクトップ）
npm run lighthouse
```

**Lighthouseレポート**: 実行後、`.lighthouseci/`ディレクトリ内のHTMLファイルをブラウザで開く

## 📋 シンプルな利点

- **1ファイル構成**: すべてのコードが`src/app.ts`に集約
- **複雑なimport不要**: 型定義・定数・関数がすべて同じファイル内
- **直感的**: 従来のJavaScript開発者にとって理解しやすい
- **型安全**: TypeScriptの恩恵を受けつつシンプル

---

**📅 更新日**: 2025-08-24  
**🎯 目標**: 直感的で保守しやすいTypeScript環境