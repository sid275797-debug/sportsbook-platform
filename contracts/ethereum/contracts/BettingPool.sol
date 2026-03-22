// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BettingPool
 * @dev Decentralized sportsbook betting pool on Ethereum/Polygon
 */
contract BettingPool is Ownable, ReentrancyGuard {
    struct Market {
        bytes32 id;
        string description;
        uint256 closingTime;
        bool settled;
        bytes32 winningOutcome;
        uint256 totalPool;
        bool cancelled;
    }

    struct Bet {
        address bettor;
        bytes32 marketId;
        bytes32 outcomeId;
        uint256 amount;
        bool claimed;
        uint256 timestamp;
    }

    IERC20 public token;
    uint256 public houseEdgeBps = 200; // 2%
    address public resolver;

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => Bet) public bets;
    mapping(bytes32 => mapping(bytes32 => uint256)) public outcomePools; // marketId => outcomeId => total
    mapping(address => bytes32[]) public userBets;

    event MarketCreated(bytes32 indexed marketId, string description, uint256 closingTime);
    event BetPlaced(bytes32 indexed betId, address indexed bettor, bytes32 indexed marketId, bytes32 outcomeId, uint256 amount);
    event MarketSettled(bytes32 indexed marketId, bytes32 winningOutcome);
    event PayoutClaimed(bytes32 indexed betId, address indexed bettor, uint256 payout);
    event MarketCancelled(bytes32 indexed marketId);

    modifier onlyResolver() {
        require(msg.sender == resolver || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _token, address _resolver) Ownable(msg.sender) {
        token = IERC20(_token);
        resolver = _resolver;
    }

    function createMarket(bytes32 marketId, string calldata description, uint256 closingTime) external onlyOwner {
        require(markets[marketId].closingTime == 0, "Market exists");
        require(closingTime > block.timestamp, "Invalid closing time");
        markets[marketId] = Market({ id: marketId, description: description, closingTime: closingTime, settled: false, winningOutcome: bytes32(0), totalPool: 0, cancelled: false });
        emit MarketCreated(marketId, description, closingTime);
    }

    function placeBet(bytes32 marketId, bytes32 outcomeId, uint256 amount) external nonReentrant {
        Market storage market = markets[marketId];
        require(!market.cancelled, "Market cancelled");
        require(!market.settled, "Market already settled");
        require(block.timestamp < market.closingTime, "Market closed");
        require(amount > 0, "Amount must be > 0");

        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        bytes32 betId = keccak256(abi.encodePacked(msg.sender, marketId, outcomeId, block.timestamp, amount));
        bets[betId] = Bet({ bettor: msg.sender, marketId: marketId, outcomeId: outcomeId, amount: amount, claimed: false, timestamp: block.timestamp });

        market.totalPool += amount;
        outcomePools[marketId][outcomeId] += amount;
        userBets[msg.sender].push(betId);

        emit BetPlaced(betId, msg.sender, marketId, outcomeId, amount);
    }

    function resolveMarket(bytes32 marketId, bytes32 winningOutcome) external onlyResolver {
        Market storage market = markets[marketId];
        require(!market.settled && !market.cancelled, "Already settled or cancelled");
        market.settled = true;
        market.winningOutcome = winningOutcome;
        emit MarketSettled(marketId, winningOutcome);
    }

    function distributePayout(bytes32 betId) external nonReentrant {
        Bet storage bet = bets[betId];
        require(bet.bettor == msg.sender, "Not your bet");
        require(!bet.claimed, "Already claimed");

        Market storage market = markets[bet.marketId];
        require(market.settled, "Market not settled");

        uint256 payout = 0;
        if (market.cancelled) {
            payout = bet.amount;
        } else if (bet.outcomeId == market.winningOutcome) {
            uint256 winningPool = outcomePools[bet.marketId][market.winningOutcome];
            uint256 grossPayout = (bet.amount * market.totalPool) / winningPool;
            uint256 fee = (grossPayout * houseEdgeBps) / 10000;
            payout = grossPayout - fee;
        }

        require(payout > 0, "No payout");
        bet.claimed = true;
        require(token.transfer(msg.sender, payout), "Transfer failed");
        emit PayoutClaimed(betId, msg.sender, payout);
    }

    function cancelMarket(bytes32 marketId) external onlyOwner {
        markets[marketId].cancelled = true;
        emit MarketCancelled(marketId);
    }

    function setHouseEdge(uint256 bps) external onlyOwner {
        require(bps <= 500, "Max 5%");
        houseEdgeBps = bps;
    }

    function getUserBets(address user) external view returns (bytes32[] memory) {
        return userBets[user];
    }
}
