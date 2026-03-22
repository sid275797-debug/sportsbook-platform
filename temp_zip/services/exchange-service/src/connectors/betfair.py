import betfairlightweight
import os
from typing import Optional

class BetfairConnector:
    def __init__(self):
        self.client = betfairlightweight.APIClient(
            username=os.getenv("BETFAIR_USERNAME", ""),
            password=os.getenv("BETFAIR_PASSWORD", ""),
            app_key=os.getenv("BETFAIR_APP_KEY", ""),
        )
        self._logged_in = False

    def login(self):
        if not self._logged_in:
            self.client.login()
            self._logged_in = True

    def get_markets(self, event_type_ids: list[str]):
        self.login()
        return self.client.betting.list_market_catalogue(
            filter=betfairlightweight.filters.market_filter(event_type_ids=event_type_ids),
            max_results=100,
        )

    def place_lay_bet(self, market_id: str, selection_id: int, price: float, size: float):
        """Place a lay bet to hedge sportsbook liability."""
        self.login()
        instruction = betfairlightweight.filters.place_instruction(
            order_type="LIMIT",
            selection_id=selection_id,
            side="LAY",
            limit_order=betfairlightweight.filters.limit_order(size=size, price=price, persistence_type="LAPSE"),
        )
        return self.client.betting.place_orders(market_id=market_id, instructions=[instruction])

    def get_account_balance(self):
        self.login()
        return self.client.account.get_account_funds()
