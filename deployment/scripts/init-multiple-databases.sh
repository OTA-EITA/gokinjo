#!/bin/bash
set -e

# 複数データベース・ユーザー作成スクリプト
# 環境変数 POSTGRES_MULTIPLE_DATABASES と POSTGRES_MULTIPLE_USERS から読み取り

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Creating multiple databases: $POSTGRES_MULTIPLE_DATABASES"
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr "," " "); do
        echo "Creating database $db"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
            CREATE DATABASE $db;
EOSQL
    done
fi

if [ -n "$POSTGRES_MULTIPLE_USERS" ]; then
    echo "Creating multiple users: $POSTGRES_MULTIPLE_USERS"
    for user_pass in $(echo $POSTGRES_MULTIPLE_USERS | tr "," " "); do
        user=$(echo $user_pass | cut -d: -f1)
        pass=$(echo $user_pass | cut -d: -f2)
        echo "Creating user $user"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
            CREATE USER $user WITH PASSWORD '$pass';
            GRANT ALL PRIVILEGES ON DATABASE airflow TO $user;
EOSQL
    done
fi

echo "Multiple databases and users setup completed"
