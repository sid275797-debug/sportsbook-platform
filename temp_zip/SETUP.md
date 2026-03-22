# Local Setup Guide — Windows 10/11

## Prerequisites (install once)

### 1. Node.js 20+
```
https://nodejs.org/en/download  →  download LTS Windows Installer (.msi)
```
Verify: `node --version` → must show `v20.x.x` or higher

### 2. pnpm 9
```powershell
npm install -g pnpm@9
pnpm --version   # must show 9.x.x
```

### 3. Docker Desktop
```
https://www.docker.com/products/docker-desktop  →  download for Windows
```
- Requires WSL2. If prompted, run `wsl --install` in PowerShell as Administrator, then restart.
- After install, open Docker Desktop from Start Menu and wait for the whale icon to show green.

Verify: `docker --version` and `docker compose version`

---

## One-time setup

### Step 1 — Extract the project
```powershell
# Right-click the zip → Extract All → choose C:\Projects\
cd C:\Projects\sportsbook-platform-v2
```

### Step 2 — Create your .env file
```powershell
copy .env.example .env
```
Open `.env` in Notepad and change **only these two lines**:
```
JWT_SECRET=any-long-random-string-here-abc123
REFRESH_TOKEN_SECRET=another-different-random-string-xyz789
```
Leave everything else exactly as-is.

### Step 3 — Install all Node.js dependencies
```powershell
pnpm install
```
Takes 1–3 minutes. You'll see "Done in Xs". Ignore deprecation warnings — they are harmless.

### Step 4 — Build shared packages (must be in this exact order)
```powershell
pnpm --filter @sportsbook/shared-types build
pnpm --filter @sportsbook/logger build
pnpm --filter @sportsbook/auth-middleware build
pnpm --filter @sportsbook/redis-client build
pnpm --filter @sportsbook/kafka-client build
pnpm --filter @sportsbook/db-client build
```
Each should print "Found 0 errors." and exit 0.

### Step 5 — Start Docker infrastructure
```powershell
docker compose up -d postgres redis zookeeper kafka kafka-ui
```
Wait 35 seconds for Kafka to finish starting, then verify:
```powershell
docker compose ps
```
All services should show `running` or `healthy`. If kafka shows `starting`, wait another 15 seconds.

### Step 6 — Run database migrations
Run each command separately, wait for it to finish before the next:
```powershell
cd services\user-service   && npx prisma migrate dev --name init --skip-seed && cd ..\..
cd services\wallet-service  && npx prisma migrate dev --name init --skip-seed && cd ..\..
cd services\betting-engine  && npx prisma migrate dev --name init --skip-seed && cd ..\..
cd services\market-service  && npx prisma migrate dev --name init --skip-seed && cd ..\..
cd services\casino-engine   && npx prisma migrate dev --name init --skip-seed && cd ..\..
```
Each should print "Your database is now in sync with your schema." If it says "already in sync" that's also fine.

---

## Starting the platform (every time)

Open **8 separate PowerShell windows** (or use Windows Terminal with tabs). In each window, `cd` to the project root first, then run one command:

| Window | Command |
|--------|---------|
| 1 — Gateway | `cd services\gateway && pnpm dev` |
| 2 — Users | `cd services\user-service && pnpm dev` |
| 3 — Wallet | `cd services\wallet-service && pnpm dev` |
| 4 — Betting | `cd services\betting-engine && pnpm dev` |
| 5 — Markets | `cd services\market-service && pnpm dev` |
| 6 — Settlement | `cd services\settlement-engine && pnpm dev` |
| 7 — Casino | `cd services\casino-engine && pnpm dev` |
| 8 — Web App | `cd apps\web && pnpm dev` |

Each service logs `started on port XXXX` when ready (takes ~5 seconds).

**Then open:** http://localhost:3000

---

## URLs when running

| URL | What it is |
|-----|------------|
| http://localhost:3000 | Web app (betting UI) |
| http://localhost:4000/health | API Gateway health check |
| http://localhost:3001/health | User service |
| http://localhost:3002/health | Wallet service |
| http://localhost:3003/health | Betting engine |
| http://localhost:3004/health | Market service |
| http://localhost:3006/health | Casino engine |
| http://localhost:8080 | Kafka UI (browse messages) |
| http://localhost:3100 | Grafana (admin / admin) |

---

## Quick test — verify everything works

```powershell
# Register a user:
curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"password123\",\"username\":\"testuser\"}"

# Should return: {"success":true,"data":{"accessToken":"...","refreshToken":"..."}}
```

---

## Stopping everything

```powershell
# Close all 8 terminal windows (Ctrl+C in each), then:
docker compose down
```

To wipe all data and start fresh:
```powershell
docker compose down -v
```

---

## Troubleshooting

**"Port 5432 already in use"**
```powershell
netstat -ano | findstr :5432
# Find the PID in the last column, then:
taskkill /PID <PID> /F
```

**"Cannot connect to database" on migration**
Make sure Docker Desktop is running and postgres container is healthy:
```powershell
docker compose ps
docker compose logs postgres --tail=20
```

**Service crashes immediately on start**
Check that your `.env` file exists in the project root and has DATABASE_URL set. The services need `.env` to find the database.

**"Module not found" on pnpm dev**
The packages weren't built yet. Run Step 4 again.

**Kafka connection errors in service logs**
Wait 35–60 seconds after `docker compose up` before starting services. Kafka takes time to initialize.

**"Migration already applied"**
That's fine — it means you ran migrations before. No action needed.

**pnpm dev keeps restarting**
That's normal — tsx watch mode restarts the service when you edit a file. It means it's working.
