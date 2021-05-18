import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';
import { ConfigurableInterestVaultConfig__factory } from '../typechain';

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
  const FAIR_LAUNCH_ADDR = process.env.FAIR_LAUNCH_ADDR;

  const MIN_DEBT_SIZE = ethers.utils.parseEther('400');
  const RESERVE_POOL_BPS = '1000';
  const KILL_PRIZE_BPS = '500';

  const INTEREST_MODEL = process.env.INTEREST_MODEL; // triple slope model
  const WNATV_ADDR = process.env.WNATV_ADDR; // WBNB
  const WNATV_RLY_ADDR = process.env.WNATV_RLY_ADDR; // WNATIVE Relay contract

  const TIMELOCK = "0xCaFc886CB1D4655193A901d9863f0163D07b3b1A";








  console.log(">> Deploying an upgradable configurableInterestVaultConfig contract");
  const ConfigurableInterestVaultConfig = (await ethers.getContractFactory(
    'ConfigurableInterestVaultConfig',
    (await ethers.getSigners())[0]
  )) as ConfigurableInterestVaultConfig__factory;
  const configurableInterestVaultConfig = await upgrades.deployProxy(
    ConfigurableInterestVaultConfig,
    [MIN_DEBT_SIZE, RESERVE_POOL_BPS, KILL_PRIZE_BPS,
    INTEREST_MODEL, WNATV_ADDR, WNATV_RLY_ADDR, FAIR_LAUNCH_ADDR]
  );
  await configurableInterestVaultConfig.deployed();
  console.log(`>> Deployed at ${configurableInterestVaultConfig.address}`);

  console.log(">> Transferring ConfigurableInterestVaultConfig's ProxyAdmin to Timelock");
  await upgrades.admin.changeProxyAdmin(configurableInterestVaultConfig.address, TIMELOCK);
  console.log("✅ Done");

};

export default func;
func.tags = ['ConfigurableInterestVaultConfig'];