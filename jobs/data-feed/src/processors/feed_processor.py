import json
import os
import uuid
from datetime import datetime, timezone
from kafka import KafkaProducer

class FeedProcessor:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=os.getenv("KAFKA_BROKERS","localhost:9092").split(","),
            value_serializer=lambda v: json.dumps(v).encode(),
            key_serializer=lambda k: k.encode() if k else b"",
        )

    def _publish(self, topic: str, key: str, value: dict):
        self.producer.send(topic, key=key, value={
            "topic": topic, "key": key, "value": value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "correlationId": str(uuid.uuid4()),
        })

    async def process_fixtures(self, data: dict):
        for fixture in data.get("schedule", {}).get("sport_events", []):
            self._publish("market.fixture.created", fixture.get("id",""), self._normalize_fixture(fixture))
        self.producer.flush()

    async def process_results(self, data: dict):
        for result in data.get("results", {}).get("results", []):
            fixture_id = result.get("sport_event", {}).get("id", "")
            self._publish("market.settled", fixture_id, {"fixtureId": fixture_id, "result": result})
        self.producer.flush()

    async def process_live_event(self, data: dict):
        event_type = data.get("metadata", {}).get("event_type","")
        fixture_id = data.get("sport_event", {}).get("id","")
        if event_type in ["score_change","period_start","period_end"]:
            self._publish("market.live_score.updated", fixture_id, {"fixtureId": fixture_id, "score": data.get("sport_event_status",{})})
        self.producer.flush()

    def _normalize_fixture(self, raw: dict) -> dict:
        return {
            "externalId": raw.get("id"),
            "homeTeam": raw.get("competitors", [{}])[0].get("name",""),
            "awayTeam": raw.get("competitors", [{}])[1].get("name","") if len(raw.get("competitors",[])) > 1 else "",
            "startTime": raw.get("start_time"),
            "sport": "cricket",
        }
