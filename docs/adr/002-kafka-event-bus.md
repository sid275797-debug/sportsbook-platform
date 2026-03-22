# ADR 002: Kafka as Event Bus

## Status
Accepted

## Context
Services need to communicate asynchronously. Options: direct HTTP callbacks, RabbitMQ, Redis pub/sub, Kafka.

## Decision
Use **Apache Kafka** via Confluent.

## Reasons
- Durable log — events can be replayed (critical for settlement)
- High throughput for live odds updates
- Multiple consumer groups can independently consume the same events
- Native partitioning for parallel processing

## Consequences
**Good:**
- Settlement engine can replay missed events after downtime
- Analytics service independently consumes all events without slowing core services
- Events are the audit trail

**Bad:**
- Operational overhead vs simpler queues
- Minimum ~3 brokers for production resilience
