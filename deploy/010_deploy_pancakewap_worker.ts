import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';
import {
  ConfigurableInterestVaultConfig__factory,
  PancakeswapWorker__factory,
  WorkerConfig__factory
} from '../typechain';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    /*
  ░██╗░░░░░░░██╗░█████╗░██████╗░███╗░░██╗██╗███╗░░██╗░██████╗░
  ░██║░░██╗░░██║██╔══██╗██╔══██╗████╗░██║██║████╗░██║██╔════╝░
  ░╚██╗████╗██╔╝███████║██████╔╝██╔██╗██║██║██╔██╗██║██║░░██╗░
  ░░████╔═████║░██╔══██║██╔══██╗██║╚████║██║██║╚████║██║░░╚██╗
  ░░╚██╔╝░╚██╔╝░██║░░██║██║░░██║██║░╚███║██║██║░╚███║╚██████╔╝
  ░░░╚═╝░░░╚═╝░░╚═╝░░╚═╝╚═╝░░╚═╝╚═╝░░╚══╝╚═╝╚═╝░░╚══╝░╚═════╝░
  Check all variables below before execute the deployment script
  */

  const VAULT_CONFIG_ADDR = "0x1CE76F2DC36657E6bd750817D7d6A51a3Facf05f";
  const WORKER_CONFIG_ADDR = '0x12641Bc011eeD2aF60249cfD5210A0B48BA5BD8e';

  const WORKER_NAME = "WBNB-BUSD PancakeswapWorker"
  const POOL_ID = 11;
  const VAULT_ADDR = process.env.VAULT_ADDR // Vault - BUSD Address
  const BASE_TOKEN_ADDR = process.env.BASE_TOKEN_ADDR;

  const ROUTER = process.env.ROUTER;
  const MASTERCHEF = process.env.MASTERCHEF;

  const ADD_STRAT_ADDR = process.env.ADD_STRAT_ADDR; // StrategyAddBaseTokenOnly
  const LIQ_STRAT_ADDR = process.env.LIQ_STRAT_ADDR; // StrategyLiquidate

  const REINVEST_BOUNTY_BPS = '300';
  const WORK_FACTOR = '6000';
  const KILL_FACTOR = '8000';
  const MAX_PRICE_DIFF = '13000';

  const TIMELOCK = "0xCaFc886CB1D4655193A901d9863f0163D07b3b1A";






  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();


  console.log(ROUTER, POOL_ID, ADD_STRAT_ADDR,
    VAULT_ADDR, BASE_TOKEN_ADDR, MASTERCHEF,
    LIQ_STRAT_ADDR, REINVEST_BOUNTY_BPS);


  console.log(`>> Deploying an upgradable PancakeswapWorker contract for ${WORKER_NAME}`);
  const PancakeswapWorker = (await ethers.getContractFactory(
    'PancakeswapWorker',
    (await ethers.getSigners())[0]
  )) as PancakeswapWorker__factory;
  const pancakeswapWorker = await upgrades.deployProxy(
    PancakeswapWorker,[
      ROUTER, POOL_ID, ADD_STRAT_ADDR,
      VAULT_ADDR, BASE_TOKEN_ADDR, MASTERCHEF,
      LIQ_STRAT_ADDR, REINVEST_BOUNTY_BPS
    ],
  );
  await pancakeswapWorker.deployed();
  console.log(`>> Deployed at ${pancakeswapWorker.address}`);

  console.log(">> Transferring PancakeswapWorker's ProxyAdmin to Timelock");
  await upgrades.admin.changeProxyAdmin(pancakeswapWorker.address, TIMELOCK);
  console.log("✅ Done");

  const config = ConfigurableInterestVaultConfig__factory.connect(VAULT_CONFIG_ADDR, (await ethers.getSigners())[0]);
  const workerConfig = WorkerConfig__factory.connect(WORKER_CONFIG_ADDR, (await ethers.getSigners())[0]);

  console.log(">> Setting WorkerConfig");
  await workerConfig.setConfigs(
    [pancakeswapWorker.address],
    [{acceptDebt: true, workFactor: WORK_FACTOR, killFactor: KILL_FACTOR, maxPriceDiff: MAX_PRICE_DIFF}],
    { gasLimit: '210000' }
  )
  console.log("✅ Done")

  console.log(">> Linking VaultConfig with WorkerConfig");
  await config.setWorkers([pancakeswapWorker.address], [workerConfig.address], { gasLimit: '210000'})
  console.log("✅ Done");
};

export default func;
func.tags = ['PancakeswapWorker'];