# Incident Response Runbook

## Severity Levels

| Level | Definition | Response Time |
|---|---|---|
| P0 | Platform down, payments failing | 15 minutes |
| P1 | Core betting broken, major data loss | 30 minutes |
| P2 | Feature degraded, partial outage | 2 hours |
| P3 | Minor bug, cosmetic issue | Next business day |

---

## Common Incidents

### Kafka consumer lag spike
```bash
# Check lag
kubectl exec -n sportsbook kafka-0 -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group settlement-engine

# Restart consumer
kubectl rollout restart deployment/settlement-engine -n sportsbook
```

### Betting engine not accepting bets
```bash
# Check service health
curl http://betting-engine:3003/health

# Check DB connection
kubectl logs deployment/betting-engine -n sportsbook --tail=100

# Check Redis
kubectl exec -n sportsbook redis-0 -- redis-cli ping
```

### Wallet balance mismatch
```bash
# Run reconciliation query in Postgres
psql $DATABASE_URL -c "
  SELECT w.user_id, w.balance,
         COALESCE(SUM(CASE WHEN t.type IN ('deposit','win','bonus') THEN t.amount
                           WHEN t.type IN ('bet','withdrawal') THEN -t.amount END), 0) as calculated
  FROM wallets w
  LEFT JOIN transactions t ON t.wallet_id = w.id AND t.status = 'completed'
  GROUP BY w.user_id, w.balance
  HAVING w.balance != COALESCE(SUM(CASE WHEN t.type IN ('deposit','win','bonus') THEN t.amount
                                        WHEN t.type IN ('bet','withdrawal') THEN -t.amount END), 0)
  LIMIT 10;"
```

### Crash game not progressing
```bash
# Casino engine WebSocket check
wscat -c ws://localhost:3006/ws

# Check casino engine logs
kubectl logs deployment/casino-engine -n sportsbook --tail=200 -f

# Restart casino engine (will restart crash game loop)
kubectl rollout restart deployment/casino-engine -n sportsbook
```

### High risk engine fraud false positives
```bash
# Temporarily raise fraud threshold
kubectl set env deployment/risk-engine FRAUD_THRESHOLD=0.95 -n sportsbook

# Check current flags
redis-cli keys "fraud:velocity:*" | head -20
```
