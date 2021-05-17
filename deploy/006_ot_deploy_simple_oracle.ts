import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers, upgrades } from 'hardhat';
import { SimplePriceOracle__factory } from '../typechain';

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
  const FEEDER_ADDR = process.env.ADMIN_ADDRESS;
  const TIMELOCK = process.env.TIMELOCK_ADDR;
















  console.log(">> Deploying an upgradable SimplePriceOracle contract");
  const SimplePriceOracle = (await ethers.getContractFactory(
    'SimplePriceOracle',
    (await ethers.getSigners())[0]
  )) as SimplePriceOracle__factory;
  const simplePriceOracle = await upgrades.deployProxy(
    SimplePriceOracle,[FEEDER_ADDR]
  );
  await simplePriceOracle.deployed();
  console.log(`>> Deployed at ${simplePriceOracle.address}`);

  console.log(">> Transferring SimplePriceOracle's ProxyAdmin to Timelock");
  await upgrades.admin.changeProxyAdmin(simplePriceOracle.address, TIMELOCK);
  console.log("✅ Done");

};

export default func;
func.tags = ['SimpleOracle'];