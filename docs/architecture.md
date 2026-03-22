# Sportsbook Platform — Architecture Overview

## System Design

This is a **microservices monorepo** powering a full-stack sports betting and casino platform. It serves three client surfaces (web, mobile, Telegram) through a unified API gateway, backed by 9 independent services, event-driven via Kafka, and deployed on Kubernetes.

---

## Monorepo Structure

```
sportsbook-platform/
├── apps/           # Client-facing applications
│   ├── web/        # Next.js 14 — SSR betting interface
│   ├── mobile/     # Flutter — iOS & Android
│   └── telegram-bot/ # Node.js + Telegraf — Telegram interface
│
├── services/       # Backend microservices (each independently deployable)
│   ├── gateway/          # API Gateway — Kong/Nginx proxy, auth, rate limiting
│   ├── user-service/     # Auth, registration, KYC, sessions
│   ├── wallet-service/   # Deposits, withdrawals, balance, ledger
│   ├── betting-engine/   # Bet placement, validation, slip management
│   ├── market-service/   # Sports, fixtures, markets, odds
│   ├── settlement-engine/# Match result processing, payout calculation
│   ├── casino-engine/    # Crash, Dice, Roulette, Blackjack, Plinko
│   ├── odds-engine/      # Probability engine, odds pricing (Python)
│   ├── risk-engine/      # Exposure tracking, fraud detection (Python)
│   └── exchange-service/ # Betfair hedging, trading bots (Python)
│
├── packages/       # Shared libraries used across services
│   ├── shared-types/     # TypeScript interfaces for all domain objects
│   ├── kafka-client/     # Producer/consumer wrappers
│   ├── auth-middleware/  # JWT verify, role guards
│   ├── logger/           # Structured pino logger
│   ├── db-client/        # Prisma + connection pooling
│   └── redis-client/     # ioredis + cache helpers
│
├── jobs/           # Background data jobs
│   ├── data-feed/        # Sportradar/Stats Perform ingestion
│   ├── scrapers/         # WebSocket + odds scrapers
│   └── ml-models/        # AI/ML prediction services
│
├── contracts/      # Smart contracts
│   ├── ethereum/         # Solidity — BettingPool, MarketResolver
│   ├── solana/           # Rust — betting_program
│   └── polygon/          # Low-fee L2 deployment
│
├── infra/          # Infrastructure as code
│   ├── k8s/             # Helm charts + Kubernetes manifests
│   ├── terraform/       # AWS EKS, RDS, ElastiCache, MSK
│   ├── ci-cd/           # GitHub Actions workflows
│   └── monitoring/      # Prometheus + Grafana configs
│
└── analytics/      # Business intelligence
    ├── grafana/     # Operations dashboards
    ├── metabase/    # Business analytics
    └── streamlit/   # Internal ops app
```

---

## Data Flow

### Bet Placement (synchronous)
```
Client → Gateway → Betting Engine → Risk Engine (check)
                                  → Odds Validator (check)
                                  → Wallet Service (debit)
                                  → Postgres (persist)
                                  → Kafka (BET_PLACED event)
```

### Settlement (asynchronous)
```
Data Feed → Kafka (MARKET_SETTLED)
         → Market Service (update outcomes)
         → Settlement Engine (calculate payouts)
         → Betting Engine (settle slips)
         → Wallet Service (credit winners)
```

### Live Odds (broadcast)
```
Odds Engine → Kafka (ODDS_UPDATED)
           → Gateway WS Hub → Redis PubSub → All connected clients
```

### Crash Game (real-time)
```
Casino Engine → WebSocket broadcast → All crash room clients
Client cashout → Casino Engine → Wallet Service (credit)
```

---

## Database Ownership

Each service **owns its own tables**. No cross-service DB reads.

| Service | DB | Tables |
|---|---|---|
| user-service | Postgres | users, sessions, kyc_documents |
| wallet-service | Postgres | wallets, transactions, withdrawals |
| betting-engine | Postgres + Redis | bet_slips, bet_selections |
| market-service | Postgres + Redis | sports, fixtures, teams, markets, outcomes |
| casino-engine | Postgres | crash_rounds, crash_bets, dice_rounds, roulette_rounds |
| analytics | ClickHouse | All (read-only replicas) |

---

## Kafka Topics

| Topic | Producer | Consumers |
|---|---|---|
| `market.fixture.created` | data-feed | market-service |
| `market.odds.updated` | odds-engine | gateway WS hub, market-service |
| `market.settled` | data-feed | settlement-engine, market-service |
| `market.live_score.updated` | data-feed | market-service |
| `bet.placed` | betting-engine | analytics, risk-engine |
| `bet.settled` | settlement-engine | analytics |
| `wallet.credited` | wallet-service | analytics |
| `wallet.debited` | wallet-service | analytics |
| `casino.crash.round_ended` | casino-engine | analytics |
| `risk.alert` | risk-engine | admin notifications |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Node services | Fastify 4, TypeScript 5, Prisma 5 |
| Python services | FastAPI, uvicorn, pydantic v2 |
| Web app | Next.js 14, React 18, Zustand, TanStack Query |
| Mobile | Flutter / React Native |
| Telegram | Telegraf 4 |
| Database | PostgreSQL 16 (primary), Redis 7 (cache), ClickHouse 24 (analytics) |
| Message bus | Apache Kafka 3.6 (via Confluent) |
| Blockchain | Solidity (Ethereum/Polygon), Rust (Solana) |
| Infra | AWS EKS, RDS, ElastiCache, MSK |
| IaC | Terraform 1.7, Helm 3 |
| Monitoring | Prometheus, Grafana, pino structured logs |
| CI/CD | GitHub Actions, Docker, Turborepo |

---

## Security

- All inter-service calls are internal (ClusterIP) — never exposed to internet
- JWT-based auth with short-lived access tokens (7d) + refresh tokens (30d)
- All secrets in Kubernetes Secrets (use sealed-secrets in production)
- Rate limiting at gateway level (100 req/min per IP)
- Provably fair crypto for all casino games
- KYC required for withdrawals above threshold
