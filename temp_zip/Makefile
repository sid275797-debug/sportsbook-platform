.PHONY: help setup dev build test lint infra-up infra-down db-migrate seed

help:
	@echo "Sportsbook Platform"
	@echo ""
	@echo "Setup:"
	@echo "  make setup        Install all dependencies"
	@echo "  make infra-up     Start Docker infra (Postgres, Redis, Kafka, etc.)"
	@echo "  make infra-down   Stop Docker infra"
	@echo "  make db-migrate   Run all Prisma migrations"
	@echo "  make seed         Seed databases with test data"
	@echo ""
	@echo "Development:"
	@echo "  make dev          Start all services in dev mode"
	@echo "  make dev-core     Start only core services (gateway + 5 microservices)"
	@echo ""
	@echo "Build & Test:"
	@echo "  make build        Build all packages and services"
	@echo "  make test         Run all tests"
	@echo "  make lint         Lint all code"

setup:
	pnpm install
	cp .env.example .env

infra-up:
	docker compose up -d postgres redis clickhouse zookeeper kafka kafka-ui grafana prometheus
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@echo "Infrastructure ready!"

infra-down:
	docker compose down

db-migrate:
	pnpm --filter @sportsbook/user-service db:migrate
	pnpm --filter @sportsbook/wallet-service db:migrate
	pnpm --filter @sportsbook/betting-engine db:migrate
	pnpm --filter @sportsbook/market-service db:migrate
	pnpm --filter @sportsbook/casino-engine db:migrate

seed:
	pnpm --filter @sportsbook/user-service db:seed

dev:
	pnpm dev

dev-core:
	pnpm --filter @sportsbook/gateway \
	     --filter @sportsbook/user-service \
	     --filter @sportsbook/wallet-service \
	     --filter @sportsbook/betting-engine \
	     --filter @sportsbook/market-service \
	     --filter @sportsbook/casino-engine \
	     dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

contracts-compile:
	cd contracts/ethereum && pnpm compile

contracts-test:
	cd contracts/ethereum && pnpm test

contracts-deploy-local:
	cd contracts/ethereum && pnpm deploy:local

train-models:
	cd jobs/ml-models && python models/fraud_detection/train.py
	cd jobs/ml-models && python models/odds_adjustment/train.py
