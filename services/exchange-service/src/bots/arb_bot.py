"""
Arbitrage detection bot.
Monitors odds across our book and exchanges for arb opportunities.
"""
import asyncio
import os

class ArbBot:
    def __init__(self):
        self.running = False

    async def start(self):
        self.running = True
        print("Arb bot started")
        while self.running:
            await self.scan_for_arb()
            await asyncio.sleep(5)

    async def scan_for_arb(self):
        # Compare our odds vs exchange odds
        # If our_odds * exchange_odds > 1, arb exists
        pass

    def stop(self):
        self.running = False
