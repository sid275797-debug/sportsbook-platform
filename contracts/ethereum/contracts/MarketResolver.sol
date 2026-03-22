// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./BettingPool.sol";

/**
 * @title MarketResolver
 * @dev Multi-sig oracle resolver for settling betting markets
 */
contract MarketResolver is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    BettingPool public bettingPool;
    uint256 public requiredConfirmations = 2;

    mapping(bytes32 => mapping(address => bytes32)) public oracleVotes; // marketId => oracle => outcome
    mapping(bytes32 => mapping(bytes32 => uint256)) public voteCount;   // marketId => outcome => count
    mapping(bytes32 => bool) public resolved;

    event OracleVoted(bytes32 indexed marketId, address indexed oracle, bytes32 outcomeId);
    event MarketAutoResolved(bytes32 indexed marketId, bytes32 winningOutcome, uint256 confirmations);

    constructor(address _bettingPool, address admin) {
        bettingPool = BettingPool(_bettingPool);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function submitResult(bytes32 marketId, bytes32 outcomeId) external onlyRole(ORACLE_ROLE) {
        require(!resolved[marketId], "Already resolved");
        require(oracleVotes[marketId][msg.sender] == bytes32(0), "Already voted");

        oracleVotes[marketId][msg.sender] = outcomeId;
        voteCount[marketId][outcomeId]++;

        emit OracleVoted(marketId, msg.sender, outcomeId);

        if (voteCount[marketId][outcomeId] >= requiredConfirmations) {
            resolved[marketId] = true;
            bettingPool.resolveMarket(marketId, outcomeId);
            emit MarketAutoResolved(marketId, outcomeId, voteCount[marketId][outcomeId]);
        }
    }

    function addOracle(address oracle) external onlyRole(ADMIN_ROLE) {
        _grantRole(ORACLE_ROLE, oracle);
    }

    function setRequiredConfirmations(uint256 n) external onlyRole(ADMIN_ROLE) {
        require(n >= 1, "Min 1");
        requiredConfirmations = n;
    }
}
