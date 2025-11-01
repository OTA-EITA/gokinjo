# Public Directory Structure

このディレクトリには、ビルド時にそのまま`dist/`にコピーされる静的ファイルを配置します。

## ✅ 正しい構造

```
public/
  └── geojson/
      └── tokyo_wards.geojson
```

## ❌ 配置してはいけないもの

- `dist/` - ビルド成果物（自動生成されます）
- `src/` - ソースコード（`frontend/src/`に配置）
- `index.html` - エントリーポイント（`frontend/index.html`に配置）

## 📝 注意事項

Viteは`public/`ディレクトリの内容を**そのまま**`dist/`にコピーします。
そのため、誤って`public/dist/`を作成すると、`dist/dist/`という
ネスト構造が生成されてしまいます。

## 🔧 クリーンアップ

もし不要なファイルが入ってしまった場合：

```bash
# 不要なファイルを削除
rm -rf public/dist public/src public/index.html

# クリーンビルド
./clean-build.sh
```
