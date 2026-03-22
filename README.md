# Sportsbook Platform

A production-grade, full-stack sports betting and casino platform — monorepo with 9 microservices, 3 client apps, smart contracts, ML models, and full DevOps stack.

## What's Inside

| Layer | Technology |
|---|---|
| **Web App** | Next.js 14, React 18, Zustand, TanStack Query |
| **Mobile App** | Flutter 3, Riverpod, GoRouter |
| **Telegram Bot** | Node.js, Telegraf 4 |
| **API Gateway** | Fastify, Kong/Nginx proxy |
| **User Service** | Fastify, Prisma, JWT, bcrypt |
| **Wallet Service** | Fastify, Prisma, Razorpay |
| **Betting Engine** | Fastify, Prisma, Redis |
| **Market Service** | Fastify, Prisma, Kafka consumer |
| **Settlement Engine** | Event-driven, Kafka |
| **Casino Engine** | Fastify, WebSocket, Crash/Dice/Roulette |
| **Odds Engine** | Python FastAPI, NumPy, SciPy |
| **Risk Engine** | Python FastAPI, scikit-learn |
| **Exchange Service** | Python FastAPI, Betfair SDK |
| **Data Feed** | Python async, Sportradar |
| **Scrapers** | Python async, aiohttp |
| **ML Models** | Python, XGBoost, FastAPI serving |
| **Smart Contracts** | Solidity (Ethereum/Polygon), Rust (Solana) |
| **Database** | PostgreSQL 16, Redis 7, ClickHouse 24 |
| **Message Bus** | Apache Kafka 3.6 |
| **Infra** | AWS EKS, Terraform, Helm, GitHub Actions |
| **Monitoring** | Prometheus, Grafana, Streamlit |

## Quick Start

### Prerequisites
- Node.js 20+, pnpm 9+
- Python 3.12+
- Docker + Docker Compose
- Flutter 3.19+ (for mobile)

### 1. Clone and install
```bash
git clone https://github.com/your-org/sportsbook-platform.git
cd sportsbook-platform
make setup
```

### 2. Start infrastructure
```bash
make infra-up
# Starts: PostgreSQL, Redis, ClickHouse, Kafka, Grafana, Prometheus
```

### 3. Run database migrations
```bash
make db-migrate
```

### 4. Start core services
```bash
make dev-core
```

### 5. Open the web app
```bash
cd apps/web && pnpm dev
# Visit http://localhost:3000
```

### Service Ports
| Service | Port |
|---|---|
| API Gateway | 4000 |
| Web App | 3000 |
| User Service | 3001 |
| Wallet Service | 3002 |
| Betting Engine | 3003 |
| Market Service | 3004 |
| Settlement Engine | — (event-driven) |
| Casino Engine | 3006 |
| Odds Engine | 3007 |
| Risk Engine | 3008 |
| Exchange Service | 3009 |
| ML Model Server | 3010 |
| Kafka UI | 8080 |
| Grafana | 3100 |
| Prometheus | 9090 |

## Architecture

See [docs/architecture.md](docs/architecture.md) for full system design.

## Deployment

```bash
# Build all Docker images
docker compose build

# Deploy to Kubernetes (production)
helm upgrade --install sportsbook ./infra/k8s/charts \
  --set global.tag=latest \
  --namespace sportsbook --create-namespace

# Terraform infrastructure
cd infra/terraform && terraform apply
```

## Smart Contracts

```bash
make contracts-compile
make contracts-test
make contracts-deploy-local
```

## ML Models

```bash
# Train fraud detection model
cd jobs/ml-models && python models/fraud_detection/train.py

# Start model server
uvicorn jobs/ml-models/serving/main:app --port 3010
```

## Contributing

1. Branch from `develop`
2. All PRs require passing `pnpm typecheck && pnpm lint && pnpm test`
3. Use conventional commits: `feat:`, `fix:`, `chore:`

## License
MIT
