# ADR 001: Monorepo with Turborepo

## Status
Accepted

## Context
We need to manage 9+ microservices, 3 client apps, 6 shared packages, smart contracts, and jobs. The options are: separate repos per service, or a monorepo.

## Decision
Use a **pnpm workspaces + Turborepo monorepo**.

## Consequences
**Good:**
- Shared types and packages are always in sync across services
- Single PR touches all affected code atomically
- Turborepo caches builds — unchanged services don't rebuild
- One place for CI/CD configuration

**Bad:**
- Repo grows large over time
- All services share the same `pnpm-lock.yaml`
- Need discipline to avoid cross-service DB imports
