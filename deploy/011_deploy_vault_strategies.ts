import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';
import { StrategyAddTwoSidesOptimal__factory } from '../typechain';

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

  const VAULT_ADDR = '0x91f956875FbFf34e14E37E3c3daEf5C979e6351F';
  const ROUTER = '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F';

  const TIMELOCK = process.env.TIMELOCK_ADDR;











  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log(">> Deploying an upgradable StrategyAddTwoSidesOptimal contract");
  const StrategyAddTwoSidesOptimal = (await ethers.getContractFactory(
    'StrategyAddTwoSidesOptimal',
    (await ethers.getSigners())[0]
  )) as StrategyAddTwoSidesOptimal__factory;
  const strategyAddTwoSidesOptimal = await upgrades.deployProxy(
    StrategyAddTwoSidesOptimal,[ROUTER, VAULT_ADDR]
  );
  await strategyAddTwoSidesOptimal.deployed();
  console.log(`>> Deployed at ${strategyAddTwoSidesOptimal.address}`);

  console.log(">> Transferring StrategyAddTwoSidesOptimal's ProxyAdmin to Timelock");
  await upgrades.admin.changeProxyAdmin(strategyAddTwoSidesOptimal.address, TIMELOCK);
  console.log("✅ Done");

};

export default func;
func.tags = ['VaultStrategies'];