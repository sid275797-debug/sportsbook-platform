import json, os, uuid
from datetime import datetime, timezone
from kafka import KafkaProducer

class OddsPublisher:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=os.getenv("KAFKA_BROKERS","localhost:9092").split(","),
            value_serializer=lambda v: json.dumps(v).encode(),
            key_serializer=lambda k: k.encode(),
        )

    async def publish_odds_update(self, market_id, outcome_id, odds, probability):
        self.producer.send("market.odds.updated", key=market_id, value={
            "topic": "market.odds.updated", "key": market_id,
            "value": {"outcomeId": outcome_id, "marketId": market_id, "newOdds": odds, "probability": probability},
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "correlationId": str(uuid.uuid4()),
        })
        self.producer.flush()
