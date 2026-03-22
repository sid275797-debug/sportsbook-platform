import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying with:', deployer.address)
  console.log('Balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)))

  // Deploy mock USDT for testing (in production use actual USDT)
  const MockToken = await ethers.getContractFactory('MockERC20')
  const token = await MockToken.deploy('Sportsbook USDT', 'SUSDT', ethers.parseUnits('1000000', 18))
  await token.waitForDeployment()
  console.log('MockToken deployed:', await token.getAddress())

  // Deploy BettingPool
  const BettingPool = await ethers.getContractFactory('BettingPool')
  const pool = await BettingPool.deploy(await token.getAddress(), deployer.address)
  await pool.waitForDeployment()
  console.log('BettingPool deployed:', await pool.getAddress())

  // Deploy MarketResolver
  const MarketResolver = await ethers.getContractFactory('MarketResolver')
  const resolver = await MarketResolver.deploy(await pool.getAddress(), deployer.address)
  await resolver.waitForDeployment()
  console.log('MarketResolver deployed:', await resolver.getAddress())

  console.log('\n=== Deployment Summary ===')
  console.log({ token: await token.getAddress(), bettingPool: await pool.getAddress(), resolver: await resolver.getAddress() })
}

main().catch((err) => { console.error(err); process.exit(1) })
