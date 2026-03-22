# ADR 003: Database per Service (Shared Postgres)

## Status
Accepted

## Context
True microservices require each service to own its data. But running 9 separate Postgres instances is expensive.

## Decision
Use **one Postgres instance with separate schemas per service**. Each service gets its own Prisma schema and never accesses another service's tables. Services communicate only via API or Kafka.

## Consequences
**Good:**
- Cost-effective (single RDS instance)
- Schema isolation via naming conventions (users.*, wallets.*, bets.*)
- Easy to migrate to separate instances later if needed

**Bad:**
- Risk of developers accidentally joining across schemas
- Single point of failure (mitigated by RDS Multi-AZ)
