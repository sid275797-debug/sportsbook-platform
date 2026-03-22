import aiohttp
import asyncio
import json
import os
import redis
from kafka import KafkaProducer

r = redis.from_url(os.getenv("REDIS_URL","redis://localhost:6379"))
producer = KafkaProducer(
    bootstrap_servers=os.getenv("KAFKA_BROKERS","localhost:9092").split(","),
    value_serializer=lambda v: json.dumps(v).encode(),
)

ODDS_SOURCES = [
    "https://odds.example.com/api/cricket",
    "https://odds2.example.com/api/cricket",
]

async def scrape_odds():
    """Scrape odds from public sources and publish to Kafka."""
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                for source in ODDS_SOURCES:
                    async with session.get(source, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            for market in data.get("markets", []):
                                producer.send("market.odds.updated", value=market)
            producer.flush()
        except Exception as e:
            print(f"Odds scraper error: {e}")
        await asyncio.sleep(30)

if __name__ == "__main__":
    asyncio.run(scrape_odds())
