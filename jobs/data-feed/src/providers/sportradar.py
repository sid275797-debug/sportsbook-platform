import aiohttp
import asyncio
import json
import os
from typing import Optional
from src.processors.feed_processor import FeedProcessor

SPORTRADAR_BASE = "https://api.sportradar.com"

class SportradarProvider:
    def __init__(self, api_key: str, processor: FeedProcessor):
        self.api_key = api_key
        self.processor = processor

    async def poll_fixtures(self):
        """Poll upcoming fixtures every 5 minutes."""
        while True:
            try:
                async with aiohttp.ClientSession() as session:
                    url = f"{SPORTRADAR_BASE}/cricket/trial/v2/en/schedules/live/schedule.json?api_key={self.api_key}"
                    async with session.get(url) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            await self.processor.process_fixtures(data)
            except Exception as e:
                print(f"Fixtures poll error: {e}")
            await asyncio.sleep(300)

    async def poll_results(self):
        """Poll match results every minute."""
        while True:
            try:
                async with aiohttp.ClientSession() as session:
                    url = f"{SPORTRADAR_BASE}/cricket/trial/v2/en/schedules/results.json?api_key={self.api_key}"
                    async with session.get(url) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            await self.processor.process_results(data)
            except Exception as e:
                print(f"Results poll error: {e}")
            await asyncio.sleep(60)

    async def stream_live_scores(self):
        """WebSocket stream for live score updates."""
        while True:
            try:
                ws_url = f"wss://api.sportradar.com/cricket/trial/v2/en/stream?api_key={self.api_key}"
                async with aiohttp.ClientSession() as session:
                    async with session.ws_connect(ws_url) as ws:
                        print("Connected to Sportradar live stream")
                        async for msg in ws:
                            if msg.type == aiohttp.WSMsgType.TEXT:
                                data = json.loads(msg.data)
                                await self.processor.process_live_event(data)
            except Exception as e:
                print(f"Live stream error: {e}. Reconnecting in 10s...")
                await asyncio.sleep(10)
