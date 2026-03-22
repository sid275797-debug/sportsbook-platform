import { expect } from 'chai'
import { ethers } from 'hardhat'
import { BettingPool, MockERC20 } from '../typechain-types'

describe('BettingPool', () => {
  let pool: BettingPool
  let token: any
  let owner: any, bettor: any, resolver: any

  beforeEach(async () => {
    [owner, bettor, resolver] = await ethers.getSigners()

    const MockToken = await ethers.getContractFactory('MockERC20')
    token = await MockToken.deploy('Test USDT', 'TUSDT', ethers.parseUnits('1000000', 18))

    const BettingPool = await ethers.getContractFactory('BettingPool')
    pool = await BettingPool.deploy(await token.getAddress(), resolver.address)

    await token.transfer(bettor.address, ethers.parseUnits('10000', 18))
    await token.connect(bettor).approve(await pool.getAddress(), ethers.parseUnits('10000', 18))
  })

  it('should create a market', async () => {
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('cricket-match-001'))
    const closingTime = Math.floor(Date.now() / 1000) + 3600
    await pool.createMarket(marketId, 'India vs Australia - Match Winner', closingTime)
    const market = await pool.markets(marketId)
    expect(market.settled).to.be.false
  })

  it('should accept a bet', async () => {
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('cricket-match-002'))
    const outcomeId = ethers.keccak256(ethers.toUtf8Bytes('india-wins'))
    const closingTime = Math.floor(Date.now() / 1000) + 3600

    await pool.createMarket(marketId, 'Match', closingTime)
    await pool.connect(bettor).placeBet(marketId, outcomeId, ethers.parseUnits('100', 18))

    const market = await pool.markets(marketId)
    expect(market.totalPool).to.equal(ethers.parseUnits('100', 18))
  })

  it('should settle and pay out winners', async () => {
    const marketId = ethers.keccak256(ethers.toUtf8Bytes('cricket-match-003'))
    const winOutcome = ethers.keccak256(ethers.toUtf8Bytes('india-wins'))
    const loseOutcome = ethers.keccak256(ethers.toUtf8Bytes('aus-wins'))
    const closingTime = Math.floor(Date.now() / 1000) + 3600

    await pool.createMarket(marketId, 'Match', closingTime)
    await pool.connect(bettor).placeBet(marketId, winOutcome, ethers.parseUnits('100', 18))

    await pool.connect(resolver).resolveMarket(marketId, winOutcome)

    const bets = await pool.getUserBets(bettor.address)
    const balanceBefore = await token.balanceOf(bettor.address)
    await pool.connect(bettor).distributePayout(bets[0]!)
    const balanceAfter = await token.balanceOf(bettor.address)

    expect(balanceAfter).to.be.gt(balanceBefore)
  })
})
