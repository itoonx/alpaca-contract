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

  const ROUTER = process.env.ROUTER; // testnet
  const TIMELOCK = "0xCaFc886CB1D4655193A901d9863f0163D07b3b1A";










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