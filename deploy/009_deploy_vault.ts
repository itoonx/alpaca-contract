import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { DebtToken__factory, FairLaunch, FairLaunch__factory, Vault, Vault__factory, WNativeRelayer, WNativeRelayer__factory } from '../typechain';
import { ethers, upgrades } from 'hardhat';

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
  const ALLOC_POINT_FOR_DEPOSIT = 100;
  const ALLOC_POINT_FOR_OPEN_POSITION = 100;
  const CONFIG_ADDR = '0x6264bAc912F046a05950f852d1B65a31Fe756d9A';
  const BASE_TOKEN_ADDR = '0xe9e7cea3dedca5984780bafc599bd69add087d56'
  const VAULT_NAME = 'BUSD VAULT'
  const NAME = 'Interest Bearing BUSD'
  const SYMBOL = 'ibBUSD';
  const WNATIVE_RELAYER_ADDR = '0xbfAA2fF97068EcbC4eF6c3f3cb04ecdD7d3B9175';

  const TIMELOCK = '';







  console.log(`>> Deploying debt${SYMBOL}`)
  const DebtToken = (await ethers.getContractFactory(
    "DebtToken",
    (await ethers.getSigners())[0]
  )) as DebtToken__factory;
  const debtToken = await DebtToken.deploy(`debt${SYMBOL}`, `debt${SYMBOL}`);
  await debtToken.deployed();
  console.log(`>> Deployed at ${debtToken.address}`);

  console.log(`>> Deploying an upgradable Vault contract for ${VAULT_NAME}`);
  const Vault = (await ethers.getContractFactory(
    'Vault',
    (await ethers.getSigners())[0]
  )) as Vault__factory;
  const vault = await upgrades.deployProxy(
    Vault,[CONFIG_ADDR, BASE_TOKEN_ADDR, NAME, SYMBOL, 18, debtToken.address]
  ) as Vault;
  await vault.deployed();
  console.log(`>> Deployed at ${vault.address}`);

  console.log(">> Transferring ownership of debtToken to Vault");
  await debtToken.transferOwnership(vault.address);
  console.log("✅ Done");

  console.log(">> Transferring Vault's ProxyAdmin to Timelock");
  await upgrades.admin.changeProxyAdmin(vault.address, TIMELOCK);
  console.log("✅ Done");

  const fairLaunch = FairLaunch__factory.connect(
    FAIR_LAUNCH_ADDR, (await ethers.getSigners())[0]) as FairLaunch;

  console.log(">> create a debtToken pool on fair launch contract");
  await fairLaunch.addPool(ALLOC_POINT_FOR_OPEN_POSITION, (await vault.debtToken()), false, { gasLimit: '2000000' });
  console.log("✅ Done");

  console.log(">> Slpee for 10000msec waiting for fairLaunch to update the pool");
  await new Promise(resolve => setTimeout(resolve, 10000));
  console.log("✅ Done");

  console.log(">> link pool with vault");
  await vault.setFairLaunchPoolId((await fairLaunch.poolLength()).sub(1), { gasLimit: '2000000' });
  console.log("✅ Done");

  console.log(">> create an ibToken pool on fair launch contract");
  await fairLaunch.addPool(ALLOC_POINT_FOR_DEPOSIT, vault.address, false, { gasLimit: '2000000' });
  console.log("✅ Done");

  const wNativeRelayer = WNativeRelayer__factory.connect(
    WNATIVE_RELAYER_ADDR, (await ethers.getSigners())[0]
  ) as WNativeRelayer;

  console.log(">> Whitelisting Vault on WNativeRelayer Contract");
  await wNativeRelayer.setCallerOk([vault.address], true);
  console.log("✅ Done");

};

export default func;
func.tags = ['Vault'];