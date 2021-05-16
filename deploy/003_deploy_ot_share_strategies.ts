import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';
import { StrategyAddBaseTokenOnly__factory, StrategyLiquidate__factory } from '../typechain';

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

  // PancakeRouter
  // const ROUTER = '0x3a7d31325E8FE684A9f5c51f878f892AB9A6EC68'; // testnet
  // const TIMELOCK = '0x41bfb641F22412d349E95D8e5dfbEFA43920B73A';


  const ROUTER = '0x3a7d31325E8FE684A9f5c51f878f892AB9A6EC68'; // testnet
  const TIMELOCK = '0x0A30566db0D76e90E20d03F929bb45456cE804A5';










  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log(">> Deploying an upgradable StrategyAddBaseTokenOnly contract");
  const StrategyAddBaseTokenOnly = (await ethers.getContractFactory(
    "StrategyAddBaseTokenOnly",
    (await ethers.getSigners())[0],
  )) as StrategyAddBaseTokenOnly__factory;
  const strategyAddBaseTokenOnly = await upgrades.deployProxy(StrategyAddBaseTokenOnly, [ROUTER]);
  await strategyAddBaseTokenOnly.deployed()
  console.log(`>> Deployed at ${strategyAddBaseTokenOnly.address}`);

  console.log(">> Transferring StrategyAddBaseTokenOnly's ProxyAdmin to Timelock");
  await upgrades.admin.changeProxyAdmin(strategyAddBaseTokenOnly.address, TIMELOCK);
  console.log("✅ Done");

  console.log(">> Deploying an upgradble StrategyLiquidate contract");
  const StrategyLiquidate = (await ethers.getContractFactory(
    "StrategyLiquidate",
    (await ethers.getSigners())[0],
  )) as StrategyLiquidate__factory;
  const strategyLiquidate = await upgrades.deployProxy(StrategyLiquidate, [ROUTER]);
  await strategyLiquidate.deployed();
  console.log(`>> Deployed at ${strategyLiquidate.address}`);

  console.log(">> Transferring StrategyLiquidate's ProxyAdmin to Timelock");
  await upgrades.admin.changeProxyAdmin(strategyLiquidate.address, TIMELOCK);
  console.log("✅ Done");
};

export default func;
func.tags = ['ShareStrategies'];