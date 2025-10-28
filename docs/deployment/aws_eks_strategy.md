# Phase 4: AWS EKS デプロイ戦略

## 概要

このドキュメントは、gokinjoアプリケーションをAWS EKS（Elastic Kubernetes Service）にデプロイするための完全な戦略を定義します。

## アーキテクチャ設計

### インフラ構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              VPC (10.0.0.0/16)                        │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Public   │  │ Public   │  │ Public   │          │  │
│  │  │ Subnet   │  │ Subnet   │  │ Subnet   │          │  │
│  │  │   AZ-a   │  │   AZ-b   │  │   AZ-c   │          │  │
│  │  │          │  │          │  │          │          │  │
│  │  │  ALB     │  │  NAT GW  │  │  NAT GW  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Private  │  │ Private  │  │ Private  │          │  │
│  │  │ Subnet   │  │ Subnet   │  │ Subnet   │          │  │
│  │  │   AZ-a   │  │   AZ-b   │  │   AZ-c   │          │  │
│  │  │          │  │          │  │          │          │  │
│  │  │  EKS     │  │  EKS     │  │  EKS     │          │  │
│  │  │  Nodes   │  │  Nodes   │  │  Nodes   │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌──────────┐                         │  │
│  │  │ Database │  │ Database │                         │  │
│  │  │ Subnet   │  │ Subnet   │                         │  │
│  │  │   AZ-a   │  │   AZ-b   │                         │  │
│  │  │          │  │          │                         │  │
│  │  │  RDS     │  │  RDS     │                         │  │
│  │  │ Primary  │  │ Standby  │                         │  │
│  │  └──────────┘  └──────────┘                         │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   S3 Bucket  │  │     ECR      │  │  CloudWatch  │     │
│  │  Data Lake   │  │   Registry   │  │   Logs/Metrics│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### コンポーネント詳細

#### 1. EKS クラスター
- **バージョン**: 1.28+
- **ノードグループ**:
  - General Purpose (t3.medium x 2-5): API/Frontend/Airflow Webserver
  - Compute Optimized (c5.xlarge x 2-4): Airflow Workers
- **Auto Scaling**: Cluster Autoscaler有効
- **セキュリティ**: IRSA (IAM Roles for Service Accounts)

#### 2. RDS PostgreSQL
- **エンジン**: PostgreSQL 15
- **エクステンション**: PostGIS 3.3
- **インスタンスタイプ**: db.t3.medium (dev), db.r5.large (prod)
- **Multi-AZ**: 本番環境で有効
- **バックアップ**: 自動バックアップ7日間保持
- **暗号化**: at-rest/in-transit両方有効

#### 3. S3 データレイク
- **バケット構成**:
  - `gokinjo-raw-{env}`: 生データ
  - `gokinjo-processed-{env}`: 変換済みデータ
  - `gokinjo-curated-{env}`: 最終データ
- **ライフサイクル**: 90日後Glacier移行
- **バージョニング**: 有効
- **暗号化**: SSE-S3

## Terraform インフラ構成

### ディレクトリ構造

```
infrastructure/
├── terraform/
│   ├── modules/
│   │   ├── vpc/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── eks/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── rds/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── s3/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars
│   │   ├── staging/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars
│   │   └── prod/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── terraform.tfvars
│   └── backend.tf
```

### 環境別設定

#### Development
- EKS: 2ノード (t3.medium)
- RDS: db.t3.medium (Single-AZ)
- S3: Standard storage
- コスト目標: $300-500/月

#### Staging
- EKS: 3ノード (t3.large)
- RDS: db.t3.large (Multi-AZ)
- S3: Standard + Intelligent-Tiering
- コスト目標: $600-800/月

#### Production
- EKS: 3-8ノード (mixed t3.large + c5.xlarge)
- RDS: db.r5.large (Multi-AZ + Read Replica)
- S3: Standard + Intelligent-Tiering + Glacier
- コスト目標: $1,500-2,000/月

## Kubernetes マニフェスト

### ディレクトリ構造

```
kubernetes/
├── base/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   └── secrets.yaml (template)
├── frontend/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── ingress.yaml
├── api/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
├── airflow/
│   ├── values.yaml
│   ├── postgres-connection-secret.yaml
│   └── s3-credentials-secret.yaml
└── monitoring/
    ├── prometheus/
    └── grafana/
```

### 主要マニフェスト例

#### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gokinjo-frontend
  namespace: gokinjo-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gokinjo-frontend
  template:
    metadata:
      labels:
        app: gokinjo-frontend
    spec:
      containers:
      - name: frontend
        image: <ECR_REGISTRY>/gokinjo-frontend:latest
        ports:
        - containerPort: 3001
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
```

#### API Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gokinjo-api
  namespace: gokinjo-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gokinjo-api
  template:
    metadata:
      labels:
        app: gokinjo-api
    spec:
      serviceAccountName: gokinjo-api-sa
      containers:
      - name: api
        image: <ECR_REGISTRY>/gokinjo-api:latest
        ports:
        - containerPort: 8081
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: gokinjo-db-secret
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

#### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gokinjo-frontend-hpa
  namespace: gokinjo-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gokinjo-frontend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Docker イメージ最適化

### マルチステージビルド例

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### API Dockerfile (Go)
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8081
CMD ["./main"]
```

### イメージサイズ目標
- Frontend: 800MB → 50MB (94%削減)
- API: 1.2GB → 15MB (99%削減)

## CI/CD パイプライン

### GitHub Actions ワークフロー

```yaml
name: Deploy to EKS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: ap-northeast-1
  ECR_REPOSITORY_FRONTEND: gokinjo-frontend
  ECR_REPOSITORY_API: gokinjo-api
  EKS_CLUSTER_NAME: gokinjo-prod

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tests
        run: |
          make test-frontend
          make test-api
  
  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push frontend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG ./frontend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG
      
      - name: Build and push API
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_API:$IMAGE_TAG ./api
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_API:$IMAGE_TAG
  
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name ${{ env.EKS_CLUSTER_NAME }} --region ${{ env.AWS_REGION }}
      
      - name: Deploy to EKS
        run: |
          kubectl apply -f kubernetes/base/
          kubectl apply -f kubernetes/frontend/
          kubectl apply -f kubernetes/api/
          kubectl set image deployment/gokinjo-frontend gokinjo-frontend=$ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:${{ github.sha }}
          kubectl set image deployment/gokinjo-api gokinjo-api=$ECR_REGISTRY/$ECR_REPOSITORY_API:${{ github.sha }}
          kubectl rollout status deployment/gokinjo-frontend
          kubectl rollout status deployment/gokinjo-api
```

## 監視・運用

### Prometheus メトリクス
- CPU/メモリ使用率
- リクエストレート/レイテンシ
- エラーレート
- データベース接続プール

### Grafana ダッシュボード
- システム概要
- アプリケーションパフォーマンス
- データベースメトリクス
- ETLジョブ実行状況

### アラート設定
- CPU使用率 > 80%
- メモリ使用率 > 90%
- エラーレート > 5%
- レスポンスタイム > 2秒

## セキュリティ

### IAM設定
- 最小権限の原則
- IRSA (IAM Roles for Service Accounts)
- S3バケットポリシー
- RDSアクセス制御

### ネットワークセキュリティ
- Security Groups
- Network ACLs
- Private Subnets
- VPC Endpoints

### シークレット管理
- AWS Secrets Manager
- Kubernetes Secrets
- 環境変数の暗号化

## コスト最適化

### リソース最適化
- Reserved Instances (1年契約)
- Savings Plans
- Spot Instances (非本番環境)
- Auto Scaling

### モニタリング
- AWS Cost Explorer
- Budgetアラート
- タグベースコスト追跡

## デプロイ手順

### 初回セットアップ

```bash
terraform init
terraform workspace new dev
terraform plan -var-file=environments/dev/terraform.tfvars
terraform apply -var-file=environments/dev/terraform.tfvars

aws eks update-kubeconfig --name gokinjo-dev --region ap-northeast-1

kubectl apply -f kubernetes/base/
helm install airflow apache-airflow/airflow -f kubernetes/airflow/values.yaml
```

### 継続的デプロイ

```bash
git push origin main
```

## ロールバック手順

```bash
kubectl rollout undo deployment/gokinjo-frontend
kubectl rollout undo deployment/gokinjo-api
```

## トラブルシューティング

### よくある問題

1. **Podが起動しない**
   - `kubectl describe pod <pod-name>`
   - イメージプル、リソース制限、設定エラーをチェック

2. **データベース接続エラー**
   - Security Groupルール確認
   - シークレット設定確認
   - RDSエンドポイント確認

3. **パフォーマンス問題**
   - HPA設定確認
   - リソースリクエスト/リミット調整
   - データベースクエリ最適化

## 次のステップ

1. **Week 3-4**: Terraform実装・テスト
2. **Week 5**: Kubernetesマニフェスト作成・テスト
3. **Week 6**: CI/CD パイプライン構築・本番デプロイ

## 参考資料

- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
