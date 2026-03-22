import asyncio
import os
from dotenv import load_dotenv
from src.providers.sportradar import SportradarProvider
from src.processors.feed_processor import FeedProcessor

load_dotenv()

async def main():
    processor = FeedProcessor()
    provider = SportradarProvider(api_key=os.getenv("SPORTRADAR_API_KEY", ""), processor=processor)
    print("Data feed job started")
    await asyncio.gather(
        provider.stream_live_scores(),
        provider.poll_fixtures(),
        provider.poll_results(),
    )

if __name__ == "__main__":
    asyncio.run(main())
