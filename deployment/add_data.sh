#!/bin/bash
# 台東区・文京区データ追加スクリプト
# 使用方法: ./add_data.sh

echo "🚀 台東区・文京区データ追加を開始します..."

# プロジェクトディレクトリに移動
cd "$(dirname "$0")"

# PostgreSQLが起動していることを確認
echo "PostgreSQL接続確認..."
if ! docker-compose exec postgis pg_isready -U postgres > /dev/null 2>&1; then
    echo "PostgreSQLが起動していません。まず 'make start' を実行してください。"
    exit 1
fi

echo "PostgreSQL接続確認完了"

# SQLファイル実行
echo "SQLファイルを実行しています..."
if docker-compose exec -T postgis psql -U postgres -d neighborhood_mapping -f /docker-entrypoint-initdb.d/add_taito_bunkyo_data.sql; then
    echo "データ追加完了！"
    echo ""
    echo "追加されたデータ:"
    echo "  • 台東区: 浅草、上野、浅草橋、蔵前"
    echo "  • 文京区: 本郷、湯島、千駄木、根津"
    echo "  • 学校: 15校追加"
    echo "  • 犯罪: 25件追加"
    echo ""
    echo "フロントエンドで確認してください: http://localhost:3001"
else
    echo "データ追加でエラーが発生しました"
    exit 1
fi
