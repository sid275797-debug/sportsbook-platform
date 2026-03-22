import asyncio
import websockets
import json
import os
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers=os.getenv("KAFKA_BROKERS","localhost:9092").split(","),
    value_serializer=lambda v: json.dumps(v).encode(),
)

async def scrape_crash():
    """Connect to crash game WS and record all rounds."""
    uri = os.getenv("CRASH_WS_URL","ws://localhost:3006/ws")
    while True:
        try:
            async with websockets.connect(uri) as ws:
                print("Connected to crash game WS")
                async for raw in ws:
                    msg = json.loads(raw)
                    if msg.get("type") in ["CRASHED", "ROUND_START"]:
                        producer.send("casino.crash.data", value=msg)
                        producer.flush()
        except Exception as e:
            print(f"Crash scraper error: {e}. Reconnecting...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(scrape_crash())
