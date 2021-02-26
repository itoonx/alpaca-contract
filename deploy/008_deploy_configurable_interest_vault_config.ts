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
  const FAIR_LAUNCH_ADDR = '0x19C64173a4fD5C2Db375f68444B2aA3070e0de08';
  const MIN_DEBT_SIZE = ethers.utils.parseEther('400');
  const RESERVE_POOL_BPS = '1000';
  const KILL_PRIZE_BPS = '500';
  const INTEREST_MODEL = '0xc5d86e9Bf604031cDe332B6d707571b0b0F372eD';
  const WNATV_ADDR = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
  const WNATV_RLY_ADDR = '0xbfAA2fF97068EcbC4eF6c3f3cb04ecdD7d3B9175';

  const TIMELOCK = '';










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