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

  const VAULT_CONFIG_ADDR = '0x6264bAc912F046a05950f852d1B65a31Fe756d9A'; // ibBUSD - Config
  const WORKER_CONFIG_ADDR = '0x56dA57F1d6750b1674051399d37B040202f8834A'; // ibWBNB - Worker - Config

  const WORKER_NAME = "WBNB-BUSD PancakeswapWorker"
  const POOL_ID = 11;
  const VAULT_ADDR = '0x91f956875FbFf34e14E37E3c3daEf5C979e6351F' // ibBUSD
  const BASE_TOKEN_ADDR = '0xe9e7cea3dedca5984780bafc599bd69add087d56' // BUSD
  const MASTER_CHEF_ADDR = '0x73feaa1eE314F8c655E354234017bE2193C9E24E' // MasterChef
  const PANCAKESWAP_ROUTER_ADDR = '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F';
  const ADD_STRAT_ADDR = '0x46b7f21BFA7eEFDE1aB59EC1fe80de713Ec2Bf17'; // StrategyAddBaseTokenOnly
  const LIQ_STRAT_ADDR = '0xaD4F6EcB4cb0BBC172E4B8174164D803dD4a5D39'; // StrategyLiquidate
  const REINVEST_BOUNTY_BPS = '300';
  const WORK_FACTOR = '6000';
  const KILL_FACTOR = '8000';
  const MAX_PRICE_DIFF = '13000';

  const TIMELOCK = process.env.TIMELOCK_ADDR;






  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log(`>> Deploying an upgradable PancakeswapWorker contract for ${WORKER_NAME}`);
  const PancakeswapWorker = (await ethers.getContractFactory(
    'PancakeswapWorker',
    (await ethers.getSigners())[0]
  )) as PancakeswapWorker__factory;
  const pancakeswapWorker = await upgrades.deployProxy(
    PancakeswapWorker,[
      VAULT_ADDR, BASE_TOKEN_ADDR, MASTER_CHEF_ADDR,
      PANCAKESWAP_ROUTER_ADDR, POOL_ID, ADD_STRAT_ADDR,
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